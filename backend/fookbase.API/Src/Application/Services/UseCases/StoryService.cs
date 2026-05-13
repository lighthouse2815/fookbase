using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class StoryService : IStoryService
{
    private const int StoryLifetimeHours = 24;

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };

    private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4",
        ".webm",
        ".mov"
    };

    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IStoryRepository _storyRepository;
    private readonly IStoryReactionRepository _storyReactionRepository;
    private readonly IUserIdentityReadModelService _userIdentityReadModelService;
    private readonly IFriendshipReadModelService _friendshipReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<StoryService> _logger;

    public StoryService(
        IAccessTokenProvider accessTokenProvider,
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        IUserIdentityReadModelService userIdentityReadModelService,
        IFriendshipReadModelService friendshipReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        IHttpContextAccessor httpContextAccessor,
        ILogger<StoryService> logger)
    {
        _accessTokenProvider = accessTokenProvider;
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _userIdentityReadModelService = userIdentityReadModelService;
        _friendshipReadModelService = friendshipReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<PagedResult<StoryResponseDto>> GetFeedAsync(
        Guid currentUserId,
        PaginationQuery query,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var feedUserIds = await ResolveFeedUserIdsAsync(currentUserId, accessToken, cancellationToken);
        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: false,
            accessToken: accessToken);
        if (blockedUserIds.Count > 0)
        {
            feedUserIds = feedUserIds
                .Where(userId => !blockedUserIds.Contains(userId))
                .ToHashSet();
        }

        var (items, totalCount) = await _storyRepository.GetPagedFeedAsync(feedUserIds, query.Page, query.PageSize, cancellationToken);
        var authors = await ResolveAuthorsAsync(items.Select(story => story.UserId), cancellationToken);
        var currentUserReactions = await ResolveCurrentUserReactionsAsync(
            items.Select(story => story.Id).ToList(),
            currentUserId,
            cancellationToken);

        var mappedItems = items.ToResponseDtos(
            currentUserId,
            authors,
            currentUserReactions,
            ResolveStoryMediaUrl);

        return PagedResult<StoryResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<StoryResponseDto>> GetByUserIdAsync(
        Guid targetUserId,
        Guid currentUserId,
        PaginationQuery query,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: true,
            accessToken: accessToken);
        if (blockedUserIds.Contains(targetUserId))
        {
            return PagedResult<StoryResponseDto>.Create(new List<StoryResponseDto>(), query.Page, query.PageSize, 0);
        }

        var targetUserExists = await EnsureUserExistsAsync(
            targetUserId,
            "Could not verify story owner user.",
            cancellationToken);
        if (!targetUserExists)
        {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        var (items, totalCount) = await _storyRepository.GetPagedActiveByUserIdAsync(
            targetUserId,
            query.Page,
            query.PageSize,
            cancellationToken);

        var authors = await ResolveAuthorsAsync(items.Select(story => story.UserId), cancellationToken);
        var currentUserReactions = await ResolveCurrentUserReactionsAsync(
            items.Select(story => story.Id).ToList(),
            currentUserId,
            cancellationToken);
        var mappedItems = items.ToResponseDtos(
            currentUserId,
            authors,
            currentUserReactions,
            ResolveStoryMediaUrl);

        return PagedResult<StoryResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<StoryResponseDto> GetByIdAsync(Guid storyId, Guid currentUserId, CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var story = await _storyRepository.GetByIdAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: true,
            accessToken: accessToken);
        if (blockedUserIds.Contains(story.UserId))
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }

        EnsureStoryIsActive(story);

        var authors = await ResolveAuthorsAsync([story.UserId], cancellationToken);
        var currentUserReactionType = await ResolveCurrentUserReactionTypeAsync(story.Id, currentUserId, cancellationToken);
        return story.ToResponseDto(currentUserId, authors, currentUserReactionType, ResolveStoryMediaUrl);
    }

    public async Task<StoryResponseDto> CreateAsync(Guid userId, CreateStoryRequestDto request, CancellationToken cancellationToken)
    {
        var mediaType = NormalizeMediaType(request.MediaType);
        var mediaUrl = NormalizeMediaUrl(request.MediaUrl);
        ValidateMediaUrlByType(mediaUrl, mediaType);

        var now = DateTime.UtcNow;
        var story = new Story
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MediaUrl = mediaUrl,
            MediaType = mediaType,
            Content = NormalizeContent(request.Content),
            CreatedAt = now,
            ExpiredAt = now.AddHours(StoryLifetimeHours),
            IsDeleted = false
        };

        await _storyRepository.AddAsync(story, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var authors = await ResolveAuthorsAsync([story.UserId], cancellationToken);
        return story.ToResponseDto(userId, authors, currentUserReactionType: null, ResolveStoryMediaUrl);
    }

    public async Task MarkAsViewedAsync(Guid storyId, Guid viewerUserId, CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(
            viewerUserId,
            cancellationToken,
            requireFresh: true,
            accessToken: accessToken);
        if (blockedUserIds.Contains(story.UserId))
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }

        EnsureStoryIsActive(story);

        if (story.UserId == viewerUserId)
        {
            return;
        }

        var hasViewed = await _storyRepository.HasViewAsync(story.Id, viewerUserId, cancellationToken);
        if (hasViewed)
        {
            return;
        }

        await _storyRepository.AddViewAsync(new StoryView
        {
            Id = Guid.NewGuid(),
            StoryId = story.Id,
            ViewerId = viewerUserId,
            ViewedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid storyId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);

        EnsureOwnerOrAdmin(story.UserId, userId, isAdmin, "You are not allowed to delete this story.");

        story.IsDeleted = true;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyCollection<Guid>> ResolveFeedUserIdsAsync(
        Guid currentUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        var userIds = await _friendshipReadModelService.ResolveContactIdsAsync(
            currentUserId,
            accessToken,
            cancellationToken,
            requireFresh: false);

        userIds.Add(currentUserId);
        return userIds;
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

    private async Task<Dictionary<Guid, ReactionType>> ResolveCurrentUserReactionsAsync(
        IReadOnlyCollection<Guid> storyIds,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var reactions = await _storyReactionRepository.GetByStoryIdsAndUserAsync(storyIds, currentUserId, cancellationToken);
        if (reactions.Count == 0)
        {
            return new Dictionary<Guid, ReactionType>();
        }

        return reactions.ToDictionary(reaction => reaction.StoryId, reaction => reaction.Type);
    }

    private async Task<ReactionType?> ResolveCurrentUserReactionTypeAsync(
        Guid storyId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var reaction = await _storyReactionRepository.GetByStoryAndUserAsync(storyId, currentUserId, cancellationToken);
        return reaction?.Type;
    }

    private string ResolveStoryMediaUrl(string mediaUrl)
    {
        var normalized = mediaUrl.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return normalized;
        }

        if (Uri.TryCreate(normalized, UriKind.Absolute, out var absoluteUri))
        {
            if (absoluteUri.IsLoopback
                && absoluteUri.AbsolutePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            {
                return BuildAbsoluteMediaUrl($"{absoluteUri.AbsolutePath}{absoluteUri.Query}");
            }

            return normalized;
        }

        if (normalized.StartsWith('/'))
        {
            return BuildAbsoluteMediaUrl(normalized);
        }

        return normalized;
    }

    private string BuildAbsoluteMediaUrl(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
        {
            return relativeUrl;
        }

        var normalizedRelativeUrl = relativeUrl.StartsWith('/') ? relativeUrl : $"/{relativeUrl}";
        var context = _httpContextAccessor.HttpContext;
        if (context is null)
        {
            return normalizedRelativeUrl;
        }

        return $"{context.Request.Scheme}://{context.Request.Host}{normalizedRelativeUrl}";
    }

    private static void EnsureStoryIsActive(Story story)
    {
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, error);
        }
    }

    private static MediaType NormalizeMediaType(string mediaType)
    {
        if (!EnumParser.TryParseMediaType(mediaType, out var normalizedType))
        {
            throw new BusinessException(ErrorCode.INVALID_STORY_MEDIA_TYPE);
        }

        return normalizedType;
    }

    private static string NormalizeMediaUrl(string mediaUrl)
    {
        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new BusinessException(ErrorCode.STORY_MEDIA_URL_REQUIRED);
        }

        var normalized = mediaUrl.Trim();
        if (Uri.TryCreate(normalized, UriKind.Absolute, out _))
        {
            return normalized;
        }

        if (normalized.StartsWith('/'))
        {
            return normalized;
        }

        throw new BusinessException(ErrorCode.STORY_MEDIA_URL_INVALID);
    }

    private static void ValidateMediaUrlByType(string mediaUrl, MediaType mediaType)
    {
        var extension = Path.GetExtension(mediaUrl);
        if (string.IsNullOrWhiteSpace(extension))
        {
            return;
        }

        if (mediaType == MediaType.IMAGE && !AllowedImageExtensions.Contains(extension))
        {
            throw new BusinessException(ErrorCode.STORY_IMAGE_URL_INVALID);
        }

        if (mediaType == MediaType.VIDEO && !AllowedVideoExtensions.Contains(extension))
        {
            throw new BusinessException(ErrorCode.STORY_VIDEO_URL_INVALID);
        }
    }

    private static string? NormalizeContent(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        return content.Trim();
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid currentUserId,
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

    private async Task<bool> EnsureUserExistsAsync(
        Guid userId,
        string serviceUnavailableMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _userIdentityReadModelService.ExistsAsync(userId, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not verify user identity for {UserId}.", userId);
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, serviceUnavailableMessage);
        }
    }

}






