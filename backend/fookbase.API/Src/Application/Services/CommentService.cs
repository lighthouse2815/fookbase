using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ILogger<CommentService> logger)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<CommentResponseDto>> GetByPostIdAsync(Guid postId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var (items, totalCount) = await _commentRepository.GetPagedByPostIdAsync(post.Id, query.Page, query.PageSize, cancellationToken);
        var authors = await ResolveAuthorsAsync(items.Select(comment => comment.UserId), cancellationToken);

        var mappedItems = items
            .Select(comment =>
            {
                var dto = comment.ToResponseDto();
                dto = dto with
                {
                    Author = authors.TryGetValue(comment.UserId, out var author)
                        ? author
                        : CreateFallbackAuthor(comment.UserId)
                };

                return dto;
            })
            .ToList();

        return PagedResult<CommentResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<CommentResponseDto> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        var dto = comment.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(comment.UserId, cancellationToken) };
    }

    public async Task<CommentResponseDto> CreateAsync(Guid userId, CreateCommentRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var post = await _postRepository.GetByIdForUpdateAsync(request.PostId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var now = DateTime.UtcNow;

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            UserId = user.Id,
            Content = request.Content.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _commentRepository.AddAsync(comment, cancellationToken);

        if (post.UserId != user.Id)
        {
            await _notificationRepository.AddAsync(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = post.UserId,
                ActorUserId = user.Id,
                PostId = post.Id,
                CommentId = comment.Id,
                Type = "COMMENT",
                Message = "Someone commented on your post.",
                IsRead = false,
                CreatedAt = now
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = comment.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(comment.UserId, cancellationToken) };
    }

    public async Task<CommentResponseDto> UpdateAsync(
        Guid commentId,
        Guid userId,
        bool isAdmin,
        UpdateCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        EnsureOwnerOrAdmin(comment.UserId, userId, isAdmin, "You are not allowed to update this comment.");

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = comment.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(comment.UserId, cancellationToken) };
    }

    public async Task DeleteAsync(Guid commentId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        EnsureOwnerOrAdmin(comment.UserId, userId, isAdmin, "You are not allowed to delete this comment.");

        comment.DeletedAt = DateTime.UtcNow;
        comment.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
    }

    private async Task<Dictionary<Guid, CommentAuthorDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, CommentAuthorDto>();
        }

        var tasks = distinctUserIds.Select(async userId =>
            new KeyValuePair<Guid, CommentAuthorDto>(userId, await ResolveAuthorAsync(userId, cancellationToken)));

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    private async Task<CommentAuthorDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var userTask = _javaApiService.GetUserById(userId, cancellationToken: cancellationToken);
            var profileTask = _javaApiService.GetProfileByUserId(userId, cancellationToken: cancellationToken);

            await Task.WhenAll(userTask, profileTask);

            var user = userTask.Result;
            var profile = profileTask.Result;
            var username = Normalize(user?.Username) ?? "user";
            var displayName = Normalize(profile?.DisplayName)
                ?? Normalize(profile?.FullName)
                ?? username;

            return new CommentAuthorDto
            {
                Id = userId,
                Username = username,
                DisplayName = displayName,
                AvatarUrl = Normalize(profile?.AvatarUrl) ?? BuildDefaultAvatarUrl(userId)
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Falling back to default comment author for user {UserId} while loading comments.",
                userId);

            return CreateFallbackAuthor(userId);
        }
    }

    private static CommentAuthorDto CreateFallbackAuthor(Guid userId)
    {
        return new CommentAuthorDto
        {
            Id = userId,
            Username = "user",
            DisplayName = "user",
            AvatarUrl = BuildDefaultAvatarUrl(userId)
        };
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string BuildDefaultAvatarUrl(Guid userId)
    {
        return $"https://i.pravatar.cc/150?u={userId}";
    }

}
