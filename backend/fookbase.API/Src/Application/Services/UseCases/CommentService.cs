using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.Common;
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

public class CommentService : ICommentService
{
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly ICommentRepository _commentRepository;
    private readonly ICommentReactionRepository _commentReactionRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IFriendshipReadModelService _friendshipReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        IAccessTokenProvider accessTokenProvider,
        ICommentRepository commentRepository,
        ICommentReactionRepository commentReactionRepository,
        IPostRepository postRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IFriendshipReadModelService friendshipReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<CommentService> logger)
    {
        _accessTokenProvider = accessTokenProvider;
        _commentRepository = commentRepository;
        _commentReactionRepository = commentReactionRepository;
        _postRepository = postRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _friendshipReadModelService = friendshipReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<CommentResponseDto>> GetByPostIdAsync(
        Guid postId,
        PaginationQuery query,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        query.Normalize();

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            accessToken: accessToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        var (topLevelComments, totalCount) = await _commentRepository.GetPagedByPostIdAsync(
            post.Id,
            query.Page,
            query.PageSize,
            cancellationToken,
            blockedUserIds);

        var allCommentsInPost = await _commentRepository.GetByPostIdAsync(
            post.Id,
            cancellationToken,
            blockedUserIds);

        var childrenByParentId = allCommentsInPost.BuildChildrenLookup();

        var scopedCommentIds = CommentMapper.CollectSubtreeIds(topLevelComments.Select(comment => comment.Id), childrenByParentId);
        var scopedComments = allCommentsInPost
            .Where(comment => scopedCommentIds.Contains(comment.Id))
            .ToList();

        var authors = await ResolveAuthorsAsync(scopedComments.Select(comment => comment.UserId), cancellationToken);
        var currentUserReactions = await ResolveCurrentUserReactionsAsync(
            scopedComments.Select(comment => comment.Id),
            currentUserId,
            cancellationToken);
        var reactionSummaries = await ResolveReactionSummariesAsync(scopedComments.Select(comment => comment.Id), cancellationToken);

        var mappedById = scopedComments.ToDictionary(
            comment => comment.Id,
            comment => comment.ToEnrichedResponseDto(authors, currentUserReactions, reactionSummaries));

        var mappedItems = topLevelComments
            .Select(comment => CommentMapper.BuildCommentTree(comment.Id, mappedById, childrenByParentId, scopedCommentIds))
            .ToList();

        return PagedResult<CommentResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<CommentResponseDto> GetByIdAsync(
        Guid commentId,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            accessToken: accessToken);
        if (blockedUserIds.Contains(comment.UserId))
        {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        var allCommentsInPost = await _commentRepository.GetByPostIdAsync(
            comment.PostId,
            cancellationToken,
            blockedUserIds);

        var childrenByParentId = allCommentsInPost.BuildChildrenLookup();
        var scopedCommentIds = CommentMapper.CollectSubtreeIds([comment.Id], childrenByParentId);
        var scopedComments = allCommentsInPost
            .Where(item => scopedCommentIds.Contains(item.Id))
            .ToList();

        if (scopedComments.Count == 0)
        {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        var authors = await ResolveAuthorsAsync(scopedComments.Select(item => item.UserId), cancellationToken);
        var currentUserReactions = await ResolveCurrentUserReactionsAsync(
            scopedComments.Select(item => item.Id),
            currentUserId,
            cancellationToken);
        var reactionSummaries = await ResolveReactionSummariesAsync(scopedComments.Select(item => item.Id), cancellationToken);
        var mappedById = scopedComments.ToDictionary(
            item => item.Id,
            item => item.ToEnrichedResponseDto(authors, currentUserReactions, reactionSummaries));

        return CommentMapper.BuildCommentTree(comment.Id, mappedById, childrenByParentId, scopedCommentIds);
    }

    public async Task<CommentResponseDto> CreateAsync(Guid userId, CreateCommentRequestDto request, CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var post = await _postRepository.GetByIdForUpdateAsync(request.PostId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            userId,
            cancellationToken,
            requireFresh: true,
            accessToken: accessToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to comment on this post.");
        }

        Comment? parentComment = null;
        if (request.ParentCommentId.HasValue)
        {
            parentComment = await _commentRepository.GetByIdAsync(request.ParentCommentId.Value, cancellationToken)
                ?? throw new BusinessException(ErrorCode.PARENT_COMMENT_NOT_FOUND);

            if (parentComment.PostId != post.Id)
            {
                throw new BusinessException(ErrorCode.PARENT_COMMENT_POST_MISMATCH);
            }

            if (blockedUserIds.Contains(parentComment.UserId))
            {
                throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to reply to this comment.");
            }
        }

        var author = await ResolveAuthorAsync(userId, cancellationToken);
        var now = DateTime.UtcNow;
        var actorName = ResolveActorName(author.DisplayName);
        var normalizedContent = NormalizeCommentContent(request.Content);
        var normalizedMediaUrls = NormalizeCommentMedia(request.MediaUrls);
        EnsureCommentHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            ParentCommentId = parentComment?.Id,
            UserId = userId,
            Content = normalizedContent,
            CreatedAt = now,
            UpdatedAt = now
        };
        foreach (var media in BuildCommentMediaItems(comment.Id, normalizedMediaUrls, now))
        {
            comment.MediaItems.Add(media);
        }

        await _commentRepository.AddAsync(comment, cancellationToken);
        Notification? createdNotification = null;

        if (parentComment is not null && parentComment.UserId != userId)
        {
            createdNotification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = parentComment.UserId,
                ActorUserId = userId,
                PostId = post.Id,
                CommentId = comment.Id,
                Type = NotificationType.COMMENT_REPLY,
                Message = $"{actorName} replied to your comment.",
                IsRead = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _notificationRepository.AddAsync(createdNotification, cancellationToken);
        }
        else if (parentComment is null && post.UserId != userId)
        {
            createdNotification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = post.UserId,
                ActorUserId = userId,
                PostId = post.Id,
                CommentId = comment.Id,
                Type = NotificationType.COMMENT,
                Message = $"{actorName} commented on your post.",
                IsRead = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _notificationRepository.AddAsync(createdNotification, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        if (createdNotification is not null)
        {
            await _notificationRealtimeService.NotifyCreatedAsync(
                createdNotification.ToResponseDto(actorName, author.AvatarUrl),
                cancellationToken);
        }

        return await GetByIdAsync(comment.Id, userId, cancellationToken);
    }

    public async Task<CommentResponseDto> UpdateAsync(
        Guid commentId,
        Guid userId,
        bool isAdmin,
        UpdateCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        EnsureOwnerOrAdmin(comment.UserId, userId, isAdmin, "You are not allowed to update this comment.");

        var normalizedContent = NormalizeCommentContent(request.Content);
        var normalizedMediaUrls = NormalizeCommentMedia(request.MediaUrls);
        EnsureCommentHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        comment.Content = normalizedContent;
        comment.UpdatedAt = DateTime.UtcNow;
        comment.MediaItems.Clear();
        foreach (var media in BuildCommentMediaItems(comment.Id, normalizedMediaUrls, DateTime.UtcNow))
        {
            comment.MediaItems.Add(media);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(comment.Id, userId, cancellationToken);
    }

    public async Task DeleteAsync(Guid commentId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        EnsureOwnerOrAdmin(comment.UserId, userId, isAdmin, "You are not allowed to delete this comment.");

        var now = DateTime.UtcNow;
        var commentsInPost = await _commentRepository.GetByPostIdForUpdateAsync(comment.PostId, cancellationToken);
        var childrenByParentId = commentsInPost.BuildChildrenLookup();
        var affectedIds = CommentMapper.CollectSubtreeIds([comment.Id], childrenByParentId);

        foreach (var item in commentsInPost.Where(item => affectedIds.Contains(item.Id)))
        {
            item.DeletedAt = now;
            item.UpdatedAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
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
        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return [];
        }

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            distinctUserIds,
            cancellationToken,
            requireFresh: false);

        return UserProfileSummaryMapper.ToAuthorSummaries(
            distinctUserIds,
            profileLookup,
            fallbackDisplayName: "user");
    }

    private async Task<AuthorSummaryDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            [userId],
            cancellationToken,
            requireFresh: false);

        var profile = profileLookup.TryGetValue(userId, out var value) ? value : null;
        return UserProfileSummaryMapper.ToAuthorSummary(userId, profile, fallbackDisplayName: "user");
    }

    private static string ResolveActorName(string? displayName)
    {
        var normalized = displayName.TrimToNull();
        if (string.IsNullOrWhiteSpace(normalized)
            || string.Equals(normalized, "user", StringComparison.OrdinalIgnoreCase))
        {
            return "Someone";
        }

        return normalized;
    }

    private static string NormalizeCommentContent(string? content)
    {
        return content?.Trim() ?? string.Empty;
    }

    private static IReadOnlyList<string> NormalizeCommentMedia(IReadOnlyList<string>? mediaUrls)
    {
        return PostMediaSerializer.Normalize(mediaUrls);
    }

    private static void EnsureCommentHasContentOrMedia(string content, IReadOnlyList<string> mediaUrls)
    {
        if (string.IsNullOrWhiteSpace(content) && mediaUrls.Count == 0)
        {
            throw new BusinessException(ErrorCode.COMMENT_TEXT_OR_MEDIA_REQUIRED);
        }
    }

    private static IReadOnlyList<CommentMedia> BuildCommentMediaItems(
        Guid commentId,
        IReadOnlyList<string> mediaUrls,
        DateTime createdAtUtc)
    {
        if (mediaUrls.Count == 0)
        {
            return Array.Empty<CommentMedia>();
        }

        return mediaUrls
            .Select((mediaUrl, index) => new CommentMedia
            {
                Id = Guid.NewGuid(),
                CommentId = commentId,
                MediaUrl = mediaUrl,
                MediaType = ResolveCommentMediaType(mediaUrl),
                SortOrder = index,
                CreatedAt = createdAtUtc
            })
            .ToList();
    }

    private static MediaType ResolveCommentMediaType(string mediaUrl)
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

    private async Task<Dictionary<Guid, ReactionType>> ResolveCurrentUserReactionsAsync(
        IEnumerable<Guid> commentIds,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        if (!currentUserId.HasValue)
        {
            return new Dictionary<Guid, ReactionType>();
        }

        var distinctCommentIds = commentIds.Distinct().ToList();
        if (distinctCommentIds.Count == 0)
        {
            return new Dictionary<Guid, ReactionType>();
        }

        var reactions = await _commentReactionRepository.GetByCommentIdsAndUserAsync(
            distinctCommentIds,
            currentUserId.Value,
            cancellationToken);

        return reactions
            .GroupBy(reaction => reaction.CommentId)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(reaction => reaction.UpdatedAt).First().Type);
    }

    private async Task<Dictionary<Guid, CommentMapper.CommentReactionSummary>> ResolveReactionSummariesAsync(
        IEnumerable<Guid> commentIds,
        CancellationToken cancellationToken)
    {
        var distinctCommentIds = commentIds.Distinct().ToList();
        if (distinctCommentIds.Count == 0)
        {
            return new Dictionary<Guid, CommentMapper.CommentReactionSummary>();
        }

        var reactions = await _commentReactionRepository.GetByCommentIdsAsync(distinctCommentIds, cancellationToken);

        return reactions
            .GroupBy(reaction => reaction.CommentId)
            .ToDictionary(
                group => group.Key,
                group => new CommentMapper.CommentReactionSummary(
                    group.Count(),
                    group
                        .GroupBy(reaction => reaction.Type)
                        .OrderByDescending(typeGroup => typeGroup.Count())
                        .ThenBy(typeGroup => typeGroup.Key)
                        .Take(3)
                        .Select(typeGroup => typeGroup.Key)
                        .ToList()));
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid? currentUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null)
    {
        return await _friendshipReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: requireFresh,
            accessToken: accessToken);
    }

}






