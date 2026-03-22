using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<CommentResponseDto>> GetByPostIdAsync(Guid postId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var (items, totalCount) = await _commentRepository.GetPagedByPostIdAsync(post.Id, query.Page, query.PageSize, cancellationToken);

        var mappedItems = items.Select(static comment => comment.ToResponseDto()).ToList();

        return PagedResult<CommentResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<CommentResponseDto> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        return comment.ToResponseDto();
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

        return comment.ToResponseDto();
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

        return comment.ToResponseDto();
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

}
