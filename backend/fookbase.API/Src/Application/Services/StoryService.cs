using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class StoryService : IStoryService
{
    private const string StoryMediaTypeImage = "IMAGE";
    private const string StoryMediaTypeVideo = "VIDEO";
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

    private readonly IStoryRepository _storyRepository;
    private readonly IStoryReactionRepository _storyReactionRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<StoryService> _logger;

    public StoryService(
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        IJavaApiService javaApiService,
        IUserReadModelService userReadModelService,
        IUnitOfWork unitOfWork,
        IHttpContextAccessor httpContextAccessor,
        ILogger<StoryService> logger)
    {
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _javaApiService = javaApiService;
        _userReadModelService = userReadModelService;
        _unitOfWork = unitOfWork;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<PagedResult<StoryResponseDto>> GetFeedAsync(
        Guid currentUserId,
        PaginationQuery query,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var feedUserIds = await ResolveFeedUserIdsAsync(currentUserId, accessToken, cancellationToken);
        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken, requireFresh: false);
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

        var mappedItems = items
            .Select(story => MapStoryToResponse(
                story,
                currentUserId,
                authors,
                currentUserReactions.TryGetValue(story.Id, out var reactionType) ? reactionType : null))
            .ToList();

        return PagedResult<StoryResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<StoryResponseDto>> GetByUserIdAsync(
        Guid targetUserId,
        Guid currentUserId,
        PaginationQuery query,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken, requireFresh: true);
        if (blockedUserIds.Contains(targetUserId))
        {
            return PagedResult<StoryResponseDto>.Create(new List<StoryResponseDto>(), query.Page, query.PageSize, 0);
        }

        var user = await _javaApiService.GetUserById(targetUserId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var (items, totalCount) = await _storyRepository.GetPagedActiveByUserIdAsync(
            user.Id,
            query.Page,
            query.PageSize,
            cancellationToken);

        var authors = await ResolveAuthorsAsync(items.Select(story => story.UserId), cancellationToken);
        var currentUserReactions = await ResolveCurrentUserReactionsAsync(
            items.Select(story => story.Id).ToList(),
            currentUserId,
            cancellationToken);
        var mappedItems = items
            .Select(story => MapStoryToResponse(
                story,
                currentUserId,
                authors,
                currentUserReactions.TryGetValue(story.Id, out var reactionType) ? reactionType : null))
            .ToList();

        return PagedResult<StoryResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<StoryResponseDto> GetByIdAsync(Guid storyId, Guid currentUserId, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        var blockedUserIds = await ResolveBlockedUserIdsAsync(currentUserId, cancellationToken, requireFresh: true);
        if (blockedUserIds.Contains(story.UserId))
        {
            throw new NotFoundException("Story not found.");
        }

        EnsureStoryIsActive(story);

        var authors = await ResolveAuthorsAsync([story.UserId], cancellationToken);
        var currentUserReactionType = await ResolveCurrentUserReactionTypeAsync(story.Id, currentUserId, cancellationToken);
        return MapStoryToResponse(story, currentUserId, authors, currentUserReactionType);
    }

    public async Task<StoryResponseDto> CreateAsync(Guid userId, CreateStoryRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var mediaType = NormalizeMediaType(request.MediaType);
        var mediaUrl = NormalizeMediaUrl(request.MediaUrl);
        ValidateMediaUrlByType(mediaUrl, mediaType);

        var now = DateTime.UtcNow;
        var story = new Story
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
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
        return MapStoryToResponse(story, userId, authors, currentUserReactionType: null);
    }

    public async Task MarkAsViewedAsync(Guid storyId, Guid viewerUserId, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        var blockedUserIds = await ResolveBlockedUserIdsAsync(viewerUserId, cancellationToken, requireFresh: true);
        if (blockedUserIds.Contains(story.UserId))
        {
            throw new NotFoundException("Story not found.");
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
            ?? throw new NotFoundException("Story not found.");

        EnsureOwnerOrAdmin(story.UserId, userId, isAdmin, "You are not allowed to delete this story.");

        story.IsDeleted = true;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyCollection<Guid>> ResolveFeedUserIdsAsync(
        Guid currentUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        var userIds = await _userReadModelService.ResolveContactIdsAsync(
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

    private StoryResponseDto MapStoryToResponse(
        Story story,
        Guid currentUserId,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        string? currentUserReactionType)
    {
        var isViewedByCurrentUser = story.UserId == currentUserId || story.Views.Any(view => view.ViewerId == currentUserId);
        var viewCount = story.Views
            .Select(view => view.ViewerId)
            .Distinct()
            .Count();

        return new StoryResponseDto
        {
            Id = story.Id,
            UserId = story.UserId,
            Author = authors.TryGetValue(story.UserId, out var author)
                ? author
                : new AuthorSummaryDto
                {
                    Id = story.UserId,
                    DisplayName = "user",
                    AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(story.UserId)
                },
            MediaUrl = ResolveStoryMediaUrl(story.MediaUrl),
            MediaType = story.MediaType,
            Content = story.Content,
            CreatedAt = story.CreatedAt,
            ExpiredAt = story.ExpiredAt,
            IsViewedByCurrentUser = isViewedByCurrentUser,
            CurrentUserReactionType = currentUserReactionType,
            ViewCount = viewCount
        };
    }

    private async Task<Dictionary<Guid, string>> ResolveCurrentUserReactionsAsync(
        IReadOnlyCollection<Guid> storyIds,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var reactions = await _storyReactionRepository.GetByStoryIdsAndUserAsync(storyIds, currentUserId, cancellationToken);
        if (reactions.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        return reactions.ToDictionary(reaction => reaction.StoryId, reaction => reaction.Type.ToString());
    }

    private async Task<string?> ResolveCurrentUserReactionTypeAsync(
        Guid storyId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var reaction = await _storyReactionRepository.GetByStoryAndUserAsync(storyId, currentUserId, cancellationToken);
        return reaction?.Type.ToString();
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
            throw new NotFoundException("Story not found.");
        }
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
    }

    private static string NormalizeMediaType(string mediaType)
    {
        var normalized = mediaType.Trim().ToUpperInvariant();
        if (normalized is not (StoryMediaTypeImage or StoryMediaTypeVideo))
        {
            throw new ArgumentException("Story media type must be IMAGE or VIDEO.");
        }

        return normalized;
    }

    private static string NormalizeMediaUrl(string mediaUrl)
    {
        if (string.IsNullOrWhiteSpace(mediaUrl))
        {
            throw new ArgumentException("Story media URL is required.");
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

        throw new ArgumentException("Story media URL must be absolute or start with '/'.");
    }

    private static void ValidateMediaUrlByType(string mediaUrl, string mediaType)
    {
        var extension = Path.GetExtension(mediaUrl);
        if (string.IsNullOrWhiteSpace(extension))
        {
            return;
        }

        if (mediaType == StoryMediaTypeImage && !AllowedImageExtensions.Contains(extension))
        {
            throw new ArgumentException("Story image URL must point to a supported image format.");
        }

        if (mediaType == StoryMediaTypeVideo && !AllowedVideoExtensions.Contains(extension))
        {
            throw new ArgumentException("Story video URL must point to a supported video format.");
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
        bool requireFresh = false)
    {
        return await _userReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: requireFresh);
    }

}
