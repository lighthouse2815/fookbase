using System.Text.RegularExpressions;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class PostService : IPostService
{
    private static readonly Regex HashtagRegex = new("#([A-Za-z0-9_]{1,50})", RegexOptions.Compiled);

    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IHashtagRepository _hashtagRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostService> _logger;

    public PostService(
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IHashtagRepository hashtagRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserReadModelService userReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<PostService> logger)
    {
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _hashtagRepository = hashtagRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userReadModelService = userReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetPagedAsync(
        PaginationQuery query,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);

        var (items, totalCount) = await _postRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            cancellationToken,
            blockedUserIds);

        var authors = await ResolveAuthorsAsync(items.Select(post => post.UserId), cancellationToken);

        var mappedItems = items
            .Select(post =>
            {
                var dto = post.ToResponseDto();
                var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);
                dto = dto with
                {
                    Author = authors.TryGetValue(post.UserId, out var author)
                        ? author
                        : CreateFallbackAuthor(post.UserId),
                    CurrentUserReactionType = currentUserReactionType,
                    LikedByCurrentUser = currentUserReactionType is not null,
                    CommentCount = ResolveVisibleCommentCount(post, blockedUserIds)
                };

                return dto;
            })
            .ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid postId, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        var dto = post.ToResponseDto();
        var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);
        return dto with
        {
            Author = await ResolveAuthorAsync(post.UserId, cancellationToken),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null,
            CommentCount = ResolveVisibleCommentCount(post, blockedUserIds)
        };
    }

    public async Task<PostResponseDto> CreateAsync(
        Guid userId,
        CreatePostRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_NOT_FOUND);

        var normalizedContent = NormalizePostContent(request.Content);
        var normalizedMediaUrls = NormalizePostMedia(request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        var now = DateTime.UtcNow;

        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Content = normalizedContent,
            CreatedAt = now,
            UpdatedAt = now
        };
        foreach (var media in BuildPostMediaItems(post.Id, normalizedMediaUrls, now))
        {
            post.MediaItems.Add(media);
        }

        var hashtags = await GetOrCreateHashtagsAsync(post.Content, cancellationToken);
        foreach (var hashtag in hashtags)
        {
            post.PostHashtags.Add(new PostHashtag
            {
                PostId = post.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await _postRepository.AddAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await TryCreateFriendPostNotificationsAsync(
            authorUserId: user.Id,
            postId: post.Id,
            accessToken: accessToken,
            cancellationToken: cancellationToken);

        var dto = post.ToResponseDto();
        var currentUserReactionType = GetCurrentUserReactionType(post, userId);
        return dto with
        {
            Author = await ResolveAuthorAsync(post.UserId, cancellationToken),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null
        };
    }

    public async Task<PostResponseDto> UpdateAsync(
        Guid postId,
        Guid userId,
        bool isAdmin,
        UpdatePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdForUpdateAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        EnsureOwnerOrAdmin(post.UserId, userId, isAdmin, "You are not allowed to update this post.");

        var normalizedContent = NormalizePostContent(request.Content);
        var normalizedMediaUrls = NormalizePostMedia(request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        post.Content = normalizedContent;
        post.UpdatedAt = DateTime.UtcNow;
        post.MediaItems.Clear();
        foreach (var media in BuildPostMediaItems(post.Id, normalizedMediaUrls, DateTime.UtcNow))
        {
            post.MediaItems.Add(media);
        }

        var hashtags = await GetOrCreateHashtagsAsync(post.Content, cancellationToken);
        post.PostHashtags.Clear();

        var updatedAt = DateTime.UtcNow;
        foreach (var hashtag in hashtags)
        {
            post.PostHashtags.Add(new PostHashtag
            {
                PostId = post.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = updatedAt,
                UpdatedAt = updatedAt
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _postRepository.GetByIdAsync(post.Id, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var dto = updated.ToResponseDto();
        var currentUserReactionType = GetCurrentUserReactionType(updated, userId);
        return dto with
        {
            Author = await ResolveAuthorAsync(updated.UserId, cancellationToken),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null
        };
    }

    public async Task DeleteAsync(Guid postId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdForUpdateAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        EnsureOwnerOrAdmin(post.UserId, userId, isAdmin, "You are not allowed to delete this post.");

        post.DeletedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<Hashtag>> GetOrCreateHashtagsAsync(string content, CancellationToken cancellationToken)
    {
        var normalizedNames = ExtractHashtags(content);
        if (normalizedNames.Count == 0)
        {
            return Array.Empty<Hashtag>();
        }

        var existing = await _hashtagRepository.GetByNamesAsync(normalizedNames, cancellationToken);
        var existingByName = existing.ToDictionary(hashtag => hashtag.Name, hashtag => hashtag);

        var missingHashtags = normalizedNames
            .Where(normalizedName => !existingByName.ContainsKey(normalizedName))
            .Select(normalizedName => new Hashtag
            {
                Id = Guid.NewGuid(),
                Name = normalizedName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        if (missingHashtags.Count > 0)
        {
            await _hashtagRepository.AddRangeAsync(missingHashtags, cancellationToken);
        }

        return existing.Concat(missingHashtags).ToList();
    }

    private static IReadOnlyList<string> ExtractHashtags(string content)
    {
        return HashtagRegex.Matches(content)
            .Select(match => match.Groups[1].Value.Trim().ToLowerInvariant())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct()
            .ToList();
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, error);
        }
    }

    private async Task<Dictionary<Guid, AuthorSummaryDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveAuthorsAsync(
            userIds,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");
    }

    private async Task<AuthorSummaryDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveAuthorAsync(
            userId,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");
    }

    private static AuthorSummaryDto CreateFallbackAuthor(Guid userId)
    {
        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = "user",
            AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
        };
    }

    private static string? GetCurrentUserReactionType(Post post, Guid? currentUserId)
    {
        if (!currentUserId.HasValue)
        {
            return null;
        }

        var reaction = post.Likes.FirstOrDefault(like => like.UserId == currentUserId.Value);
        if (reaction is null)
        {
            return null;
        }

        return NormalizePostReactionType(reaction.Type);
    }

    private static int ResolveVisibleCommentCount(Post post, IReadOnlySet<Guid> blockedUserIds)
    {
        if (blockedUserIds.Count == 0)
        {
            return post.Comments.Count;
        }

        return post.Comments.Count(comment => !blockedUserIds.Contains(comment.UserId));
    }

    private static string NormalizePostReactionType(ReactionType type)
    {
        return type.ToString();
    }

    private static void EnsurePostHasContentOrMedia(string content, IReadOnlyList<string> mediaUrls)
    {
        if (string.IsNullOrWhiteSpace(content) && mediaUrls.Count == 0)
        {
            throw new BusinessException(ErrorCode.POST_TEXT_OR_MEDIA_REQUIRED);
        }
    }

    private static string NormalizePostContent(string? content)
    {
        return content?.Trim() ?? string.Empty;
    }

    private static IReadOnlyList<string> NormalizePostMedia(IReadOnlyList<string>? mediaUrls)
    {
        return PostMediaSerializer.Normalize(mediaUrls);
    }

    private static IReadOnlyList<PostMedia> BuildPostMediaItems(Guid postId, IReadOnlyList<string> mediaUrls, DateTime createdAtUtc)
    {
        if (mediaUrls.Count == 0)
        {
            return Array.Empty<PostMedia>();
        }

        return mediaUrls
            .Select((mediaUrl, index) => new PostMedia
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                MediaUrl = mediaUrl,
                MediaType = ResolvePostMediaType(mediaUrl),
                SortOrder = index,
                CreatedAt = createdAtUtc
            })
            .ToList();
    }

    private static MediaType ResolvePostMediaType(string mediaUrl)
    {
        var normalized = mediaUrl.Trim().ToLowerInvariant();
        if (normalized.Contains("/video/upload/")
            || normalized.StartsWith("data:video/")
            || normalized.EndsWith(".mp4")
            || normalized.EndsWith(".webm")
            || normalized.EndsWith(".ogg")
            || normalized.EndsWith(".mov")
            || normalized.EndsWith(".m4v")
            || normalized.EndsWith(".avi")
            || normalized.EndsWith(".mkv"))
        {
            return MediaType.VIDEO;
        }

        return MediaType.IMAGE;
    }

    private async Task TryCreateFriendPostNotificationsAsync(
        Guid authorUserId,
        Guid postId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var friendIds = await _userReadModelService.ResolveContactIdsAsync(
                authorUserId,
                accessToken?.Trim(),
                cancellationToken,
                requireFresh: false);

            friendIds.Remove(authorUserId);
            if (friendIds.Count == 0)
            {
                return;
            }

            var actorSummary = await ResolveNotificationActorSummaryAsync(authorUserId, accessToken, cancellationToken);
            var now = DateTime.UtcNow;
            var createdNotifications = new List<Notification>(friendIds.Count);

            foreach (var friendId in friendIds)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = friendId,
                    ActorUserId = authorUserId,
                    PostId = postId,
                    Type = NotificationType.FRIEND_POST,
                    Message = $"{actorSummary.DisplayName} shared a new post.",
                    IsRead = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _notificationRepository.AddAsync(notification, cancellationToken);
                createdNotifications.Add(notification);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            foreach (var notification in createdNotifications)
            {
                await _notificationRealtimeService.NotifyCreatedAsync(
                    notification.ToResponseDto(actorSummary.DisplayName, actorSummary.AvatarUrl),
                    cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not create friend-post notifications for post {PostId}.",
                postId);
        }
    }

    private async Task<AuthorSummaryDto> ResolveNotificationActorSummaryAsync(
        Guid actorUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveAuthorAsync(
            actorUserId,
            cancellationToken,
            requireFresh: false,
            accessToken: accessToken,
            fallbackDisplayName: "Your friend");
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(Guid? currentUserId, CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: false);
    }

}
