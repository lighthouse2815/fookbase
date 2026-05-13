using System.Text.RegularExpressions;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Constants;
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

    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IPostRepository _postRepository;
    private readonly IHashtagRepository _hashtagRepository;
    private readonly INotificationService _notificationService;
    private readonly IFriendshipReadModelService _friendshipReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostService> _logger;

    public PostService(
        IAccessTokenProvider accessTokenProvider,
        IPostRepository postRepository,
        IHashtagRepository hashtagRepository,
        INotificationService notificationService,
        IFriendshipReadModelService friendshipReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<PostService> logger)
    {
        _accessTokenProvider = accessTokenProvider;
        _postRepository = postRepository;
        _hashtagRepository = hashtagRepository;
        _notificationService = notificationService;
        _friendshipReadModelService = friendshipReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetPagedAsync(
        PaginationQuery query,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var viewerFriendUserIds = await ResolveViewerFriendUserIdsAsync(currentUserId, cancellationToken);
        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);

        var (items, totalCount) = await _postRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            currentUserId,
            viewerFriendUserIds,
            cancellationToken,
            blockedUserIds);

        var authors = await ResolveAuthorsAsync(
            items
                .Select(post => post.UserId)
                .Concat(items.Where(post => post.OriginalPost is not null).Select(post => post.OriginalPost!.UserId)),
            cancellationToken);
        var shareCounts = await _postRepository.GetShareCountsAsync(
            items.Select(post => post.Id).ToList(),
            cancellationToken);
        var mappedItems = items.ToResponseDtos(
            authors,
            currentUserId,
            blockedUserIds,
            shareCounts,
            viewerFriendUserIds);

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<PostResponseDto>> GetPagedByHashtagAsync(
        string hashtagName,
        PaginationQuery query,
        Guid? currentUserId,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var normalizedHashtag = NormalizeHashtagKeyword(hashtagName);
        var viewerFriendUserIds = await ResolveViewerFriendUserIdsAsync(currentUserId, cancellationToken);
        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);

        var (items, totalCount) = await _postRepository.GetPagedByHashtagAsync(
            normalizedHashtag,
            query.Page,
            query.PageSize,
            currentUserId,
            viewerFriendUserIds,
            cancellationToken,
            blockedUserIds);

        var authors = await ResolveAuthorsAsync(
            items
                .Select(post => post.UserId)
                .Concat(items.Where(post => post.OriginalPost is not null).Select(post => post.OriginalPost!.UserId)),
            cancellationToken);
        var shareCounts = await _postRepository.GetShareCountsAsync(
            items.Select(post => post.Id).ToList(),
            cancellationToken);
        var mappedItems = items.ToResponseDtos(
            authors,
            currentUserId,
            blockedUserIds,
            shareCounts,
            viewerFriendUserIds);

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid postId, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var viewerFriendUserIds = await ResolveViewerFriendUserIdsAsync(currentUserId, cancellationToken);
        var post = await _postRepository.GetVisibleByIdAsync(
            postId,
            currentUserId,
            viewerFriendUserIds,
            cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        var userIds = new List<Guid> { post.UserId };
        if (post.OriginalPost is not null)
        {
            userIds.Add(post.OriginalPost.UserId);
        }

        var authorLookup = await ResolveAuthorsAsync(userIds, cancellationToken);
        var shareCounts = await _postRepository.GetShareCountsAsync([post.Id], cancellationToken);
        var author = authorLookup[post.UserId];
        return post.ToResponseDto(
            currentUserId,
            blockedUserIds,
            author,
            shareCounts,
            authorLookup,
            viewerFriendUserIds);
    }

    public async Task<PostResponseDto> CreateAsync(
        Guid userId,
        CreatePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();

        var normalizedContent = request.Content?.Trim() ?? string.Empty;
        var normalizedMediaUrls = PostMediaSerializer.Normalize(request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        var now = DateTime.UtcNow;

        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Content = normalizedContent,
            Visibility = request.Visibility,
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
            authorUserId: userId,
            postId: post.Id,
            accessToken: accessToken,
            cancellationToken: cancellationToken);

        var author = (await ResolveAuthorsAsync([post.UserId], cancellationToken))[post.UserId];
        return post.ToResponseDto(userId, author: author);
    }

    public async Task<PostResponseDto> ShareAsync(
        Guid postId,
        Guid userId,
        SharePostRequestDto? request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var viewerFriendUserIds = await ResolveViewerFriendUserIdsAsync(userId, cancellationToken, requireFresh: true);
        var blockedUserIds = await ResolveBlockedUserIdsAsync(userId, cancellationToken);

        var sourcePost = await _postRepository.GetVisibleByIdAsync(
            postId,
            userId,
            viewerFriendUserIds,
            cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        if (blockedUserIds.Contains(sourcePost.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        var originalPostId = sourcePost.OriginalPostId ?? sourcePost.Id;
        var alreadyShared = await _postRepository.HasSharedOriginalPostAsync(userId, originalPostId, cancellationToken);
        if (alreadyShared)
        {
            throw new BusinessException(
                ErrorCode.BUSINESS_RULE_VIOLATION,
                "You already shared this post.");
        }

        var normalizedContent = request?.Content?.Trim() ?? string.Empty;
        var now = DateTime.UtcNow;

        var sharedPost = new Post
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OriginalPostId = originalPostId,
            Content = normalizedContent,
            Visibility = PostVisibility.PUBLIC,
            CreatedAt = now,
            UpdatedAt = now
        };

        var hashtags = await GetOrCreateHashtagsAsync(sharedPost.Content, cancellationToken);
        foreach (var hashtag in hashtags)
        {
            sharedPost.PostHashtags.Add(new PostHashtag
            {
                PostId = sharedPost.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await _postRepository.AddAsync(sharedPost, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await TryCreateFriendPostNotificationsAsync(
            authorUserId: userId,
            postId: sharedPost.Id,
            accessToken: accessToken,
            cancellationToken: cancellationToken);

        var created = await _postRepository.GetByIdAsync(sharedPost.Id, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var authorLookup = await ResolveAuthorsAsync(
            new[] { created.UserId, created.OriginalPost?.UserId ?? Guid.Empty },
            cancellationToken);
        var shareCounts = await _postRepository.GetShareCountsAsync([created.Id], cancellationToken);
        var author = authorLookup[created.UserId];

        return created.ToResponseDto(
            userId,
            blockedUserIds,
            author,
            shareCounts,
            authorLookup,
            viewerFriendUserIds);
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

        var normalizedContent = request.Content?.Trim() ?? string.Empty;
        var normalizedMediaUrls = PostMediaSerializer.Normalize(request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        post.Content = normalizedContent;
        if (request.Visibility.HasValue)
        {
            post.Visibility = request.Visibility.Value;
        }
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

        var author = (await ResolveAuthorsAsync([updated.UserId], cancellationToken))[updated.UserId];
        return updated.ToResponseDto(
            userId,
            author: author,
            viewerFriendUserIds: new HashSet<Guid>());
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

    private static string NormalizeHashtagKeyword(string hashtagName)
    {
        var normalized = hashtagName.Trim().TrimStart('#').ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException(ErrorCode.HASHTAG_KEYWORD_REQUIRED);
        }

        return normalized;
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

    private static void EnsurePostHasContentOrMedia(string content, IReadOnlyList<string> mediaUrls)
    {
        if (string.IsNullOrWhiteSpace(content) && mediaUrls.Count == 0)
        {
            throw new BusinessException(ErrorCode.POST_TEXT_OR_MEDIA_REQUIRED);
        }
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
            var friendIds = await _friendshipReadModelService.ResolveContactIdsAsync(
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

            foreach (var friendId in friendIds)
            {
                await _notificationService.CreateAsync(
                    new CreateNotificationRequestDto
                    {
                        UserId = friendId,
                        ActorUserId = authorUserId,
                        PostId = postId,
                        Type = NotificationType.FRIEND_POST.ToString(),
                        Message = string.Format(
                            ReportNotificationMessageConstants.Post.FriendPostFormat,
                            actorSummary.DisplayName)
                    },
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
        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            [actorUserId],
            cancellationToken,
            requireFresh: false,
            accessToken: accessToken);

        var profile = profileLookup.TryGetValue(actorUserId, out var value) ? value : null;
        return UserProfileSummaryMapper.ToAuthorSummary(actorUserId, profile, fallbackDisplayName: "Your friend");
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(Guid? currentUserId, CancellationToken cancellationToken)
    {
        return await _friendshipReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: false);
    }

    private async Task<HashSet<Guid>> ResolveViewerFriendUserIdsAsync(
        Guid? currentUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        if (!currentUserId.HasValue || currentUserId.Value == Guid.Empty)
        {
            return [];
        }

        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var friendUserIds = await _friendshipReadModelService.ResolveContactIdsAsync(
            currentUserId.Value,
            accessToken,
            cancellationToken,
            requireFresh: requireFresh);
        friendUserIds.Remove(currentUserId.Value);
        return friendUserIds;
    }

}
