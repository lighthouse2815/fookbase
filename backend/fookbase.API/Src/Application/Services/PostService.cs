using System.Text.RegularExpressions;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
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
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostService> _logger;

    public PostService(
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IHashtagRepository hashtagRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUnitOfWork unitOfWork,
        ILogger<PostService> logger)
    {
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _hashtagRepository = hashtagRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
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

        var (items, totalCount) = await _postRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        if (blockedUserIds.Count > 0)
        {
            items = items
                .Where(post => !blockedUserIds.Contains(post.UserId))
                .ToList();
        }

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
                    LikedByCurrentUser = currentUserReactionType is not null
                };

                return dto;
            })
            .ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid postId, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new NotFoundException("Post not found.");
        }

        var dto = post.ToResponseDto();
        var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);
        return dto with
        {
            Author = await ResolveAuthorAsync(post.UserId, cancellationToken),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null
        };
    }

    public async Task<PostResponseDto> CreateAsync(
        Guid userId,
        CreatePostRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var normalizedContent = NormalizePostContent(request.Content);
        var normalizedMediaUrls = NormalizePostMedia(request.ImageUrl, request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        var now = DateTime.UtcNow;

        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Content = normalizedContent,
            ImageUrl = PostMediaSerializer.Serialize(normalizedMediaUrls),
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
                CreatedAt = now
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
            ?? throw new NotFoundException("Post not found.");

        EnsureOwnerOrAdmin(post.UserId, userId, isAdmin, "You are not allowed to update this post.");

        var normalizedContent = NormalizePostContent(request.Content);
        var normalizedMediaUrls = NormalizePostMedia(request.ImageUrl, request.ImageUrls);
        EnsurePostHasContentOrMedia(normalizedContent, normalizedMediaUrls);

        post.Content = normalizedContent;
        post.ImageUrl = PostMediaSerializer.Serialize(normalizedMediaUrls);
        post.UpdatedAt = DateTime.UtcNow;
        post.MediaItems.Clear();
        foreach (var media in BuildPostMediaItems(post.Id, normalizedMediaUrls, DateTime.UtcNow))
        {
            post.MediaItems.Add(media);
        }

        var hashtags = await GetOrCreateHashtagsAsync(post.Content, cancellationToken);
        post.PostHashtags.Clear();

        foreach (var hashtag in hashtags)
        {
            post.PostHashtags.Add(new PostHashtag
            {
                PostId = post.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _postRepository.GetByIdAsync(post.Id, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

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
            ?? throw new NotFoundException("Post not found.");

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

        var existing = await _hashtagRepository.GetByNormalizedNamesAsync(normalizedNames, cancellationToken);
        var existingByNormalizedName = existing.ToDictionary(hashtag => hashtag.NormalizedName, hashtag => hashtag);

        var missingHashtags = normalizedNames
            .Where(normalizedName => !existingByNormalizedName.ContainsKey(normalizedName))
            .Select(normalizedName => new Hashtag
            {
                Id = Guid.NewGuid(),
                Name = normalizedName,
                NormalizedName = normalizedName,
                CreatedAt = DateTime.UtcNow
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
            throw new ForbiddenException(error);
        }
    }

    private async Task<Dictionary<Guid, AuthorSummaryDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, AuthorSummaryDto>();
        }

        var tasks = distinctUserIds.Select(async userId =>
            new KeyValuePair<Guid, AuthorSummaryDto>(userId, await ResolveAuthorAsync(userId, cancellationToken)));

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    private async Task<AuthorSummaryDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var profileTask = _javaApiService.GetProfileSummaryByUserId(userId, cancellationToken: cancellationToken);
            var profile = await profileTask;
            var displayName = profile?.DisplayName.TrimToNull()
                ?? "user";

            return new AuthorSummaryDto
            {
                Id = userId,
                DisplayName = displayName,
                AvatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
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
                "Falling back to default post author for user {UserId} while loading feed.",
                userId);
            return CreateFallbackAuthor(userId);
        }
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

    private static string NormalizePostReactionType(ReactionType type)
    {
        return type.ToString();
    }

    private static void EnsurePostHasContentOrMedia(string content, IReadOnlyList<string> mediaUrls)
    {
        if (string.IsNullOrWhiteSpace(content) && mediaUrls.Count == 0)
        {
            throw new ArgumentException("Post must include text or media.");
        }
    }

    private static string NormalizePostContent(string? content)
    {
        return content?.Trim() ?? string.Empty;
    }

    private static IReadOnlyList<string> NormalizePostMedia(string? media, IReadOnlyList<string>? mediaUrls)
    {
        if (mediaUrls is { Count: > 0 })
        {
            return PostMediaSerializer.Normalize(mediaUrls);
        }

        return PostMediaSerializer.Normalize([media]);
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

    private static string ResolvePostMediaType(string mediaUrl)
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
            return "VIDEO";
        }

        return "IMAGE";
    }

    private async Task TryCreateFriendPostNotificationsAsync(
        Guid authorUserId,
        Guid postId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return;
        }

        try
        {
            var contactsResult = await _javaApiService.GetContactsByUserAsync(accessToken, cancellationToken);
            if (!contactsResult.IsSuccess || contactsResult.Data is null || contactsResult.Data.Count == 0)
            {
                return;
            }

            var friendIds = contactsResult.Data
                .Select(contact => ParseGuid(contact.UserId))
                .Where(friendId => friendId.HasValue && friendId.Value != authorUserId)
                .Select(friendId => friendId!.Value)
                .Distinct()
                .ToList();

            if (friendIds.Count == 0)
            {
                return;
            }

            var authorName = await ResolveNotificationActorNameAsync(authorUserId, accessToken, cancellationToken);
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
                    Type = "FRIEND_POST",
                    Message = $"{authorName} shared a new post.",
                    IsRead = false,
                    CreatedAt = now
                };

                await _notificationRepository.AddAsync(notification, cancellationToken);
                createdNotifications.Add(notification);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            foreach (var notification in createdNotifications)
            {
                await _notificationRealtimeService.NotifyCreatedAsync(notification.ToResponseDto(), cancellationToken);
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

    private async Task<string> ResolveNotificationActorNameAsync(
        Guid actorUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var profileSummary = await _javaApiService.GetProfileSummaryByUserId(
                actorUserId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            var summaryDisplayName = profileSummary?.DisplayName.TrimToNull();
            if (!string.IsNullOrWhiteSpace(summaryDisplayName))
            {
                return summaryDisplayName;
            }
            return "Your friend";
        }
        catch
        {
            return "Your friend";
        }
    }

    private static Guid? ParseGuid(string? value)
    {
        return Guid.TryParse(value, out var parsed) ? parsed : null;
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(Guid? currentUserId, CancellationToken cancellationToken)
    {
        if (!currentUserId.HasValue)
        {
            return new HashSet<Guid>();
        }

        try
        {
            var result = await _javaApiService.GetBlockedUsersAsync(string.Empty, cancellationToken);
            if (!result.IsSuccess || result.Data is null || result.Data.Count == 0)
            {
                return new HashSet<Guid>();
            }

            return result.Data
                .Select(item => item.UserId)
                .Where(userId => !string.IsNullOrWhiteSpace(userId))
                .Select(userId => Guid.TryParse(userId, out var parsedUserId) ? parsedUserId : (Guid?)null)
                .Where(parsedUserId => parsedUserId.HasValue)
                .Select(parsedUserId => parsedUserId!.Value)
                .ToHashSet();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not resolve blocked users for post feed of user {UserId}.",
                currentUserId.Value);

            return new HashSet<Guid>();
        }
    }

}
