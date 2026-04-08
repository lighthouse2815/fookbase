using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Application.Services;

public class StoryService : IStoryService
{
    private const string StoryMediaTypeImage = "IMAGE";
    private const string StoryMediaTypeVideo = "VIDEO";
    private const int StoryLifetimeHours = 24;
    private const long MaxImageBytes = 10 * 1024 * 1024;
    private const long MaxVideoBytes = 50 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private static readonly HashSet<string> AllowedVideoContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "video/mp4",
        "video/webm",
        "video/quicktime"
    };

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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly CloudinaryOptions _cloudinaryOptions;
    private readonly ILogger<StoryService> _logger;

    public StoryService(
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        IJavaApiService javaApiService,
        IUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory,
        IWebHostEnvironment webHostEnvironment,
        IHttpContextAccessor httpContextAccessor,
        IOptions<CloudinaryOptions> cloudinaryOptions,
        ILogger<StoryService> logger)
    {
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _javaApiService = javaApiService;
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _webHostEnvironment = webHostEnvironment;
        _httpContextAccessor = httpContextAccessor;
        _cloudinaryOptions = cloudinaryOptions.Value;
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

    public async Task<StoryUploadResponseDto> UploadMediaAsync(Guid userId, IFormFile file, CancellationToken cancellationToken)
    {
        var mediaType = ResolveMediaType(file);
        ValidateFileSize(file, mediaType);

        string uploadedUrl;
        if (IsCloudinaryConfigured(_cloudinaryOptions))
        {
            try
            {
                uploadedUrl = await UploadToCloudinaryAsync(userId, file, cancellationToken);
            }
            catch (ServiceUnavailableException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Cloudinary upload failed for user {UserId}. Falling back to local story storage.",
                    userId);

                uploadedUrl = await UploadToLocalStorageAsync(userId, file, mediaType, cancellationToken);
            }
        }
        else
        {
            uploadedUrl = await UploadToLocalStorageAsync(userId, file, mediaType, cancellationToken);
        }

        return new StoryUploadResponseDto
        {
            MediaUrl = uploadedUrl,
            MediaType = mediaType,
            SizeBytes = file.Length
        };
    }

    public async Task MarkAsViewedAsync(Guid storyId, Guid viewerUserId, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

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
        var userIds = new HashSet<Guid> { currentUserId };

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return userIds;
        }

        try
        {
            var contactsResult = await _javaApiService.GetContactsByUserAsync(accessToken, cancellationToken);
            if (!contactsResult.IsSuccess || contactsResult.Data is null)
            {
                return userIds;
            }

            foreach (var contact in contactsResult.Data)
            {
                if (Guid.TryParse(contact.UserId, out var friendId))
                {
                    userIds.Add(friendId);
                }
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not resolve contacts for story feed of user {UserId}.", currentUserId);
        }

        return userIds;
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
            var displayName = Normalize(profile?.DisplayName)
                ?? "user";

            return new AuthorSummaryDto
            {
                Id = userId,
                DisplayName = displayName,
                AvatarUrl = Normalize(profile?.AvatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
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
                "Falling back to default story author for user {UserId}.",
                userId);

            return new AuthorSummaryDto
            {
                Id = userId,
                DisplayName = "user",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
            };
        }
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

    private async Task<string> UploadToCloudinaryAsync(Guid userId, IFormFile file, CancellationToken cancellationToken)
    {
        var folder = BuildStoryUploadFolder(_cloudinaryOptions.UploadFolder, userId);
        var publicId = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var parametersToSign = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = folder,
            ["public_id"] = publicId,
            ["timestamp"] = timestamp.ToString(),
            ["upload_preset"] = _cloudinaryOptions.UploadPreset
        };

        var signature = GenerateCloudinarySignature(parametersToSign, _cloudinaryOptions.ApiSecret);

        using var multipart = new MultipartFormDataContent();
        multipart.Add(new StringContent(_cloudinaryOptions.ApiKey), "api_key");
        multipart.Add(new StringContent(_cloudinaryOptions.UploadPreset), "upload_preset");
        multipart.Add(new StringContent(folder), "folder");
        multipart.Add(new StringContent(publicId), "public_id");
        multipart.Add(new StringContent(timestamp.ToString()), "timestamp");
        multipart.Add(new StringContent(signature), "signature");

        using (var stream = file.OpenReadStream())
        {
            using var fileContent = new StreamContent(stream);
            if (!string.IsNullOrWhiteSpace(file.ContentType))
            {
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            }

            multipart.Add(fileContent, "file", file.FileName);

            var httpClient = _httpClientFactory.CreateClient();
            var endpoint = $"https://api.cloudinary.com/v1_1/{_cloudinaryOptions.CloudName}/auto/upload";
            using var response = await httpClient.PostAsync(endpoint, multipart, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = TryExtractCloudinaryError(body)
                    ?? $"Cloudinary upload failed with status {(int)response.StatusCode}.";
                throw new ServiceUnavailableException(error);
            }

            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("secure_url", out var secureUrlElement)
                || secureUrlElement.ValueKind != JsonValueKind.String)
            {
                throw new ServiceUnavailableException("Cloudinary upload succeeded but returned no secure_url.");
            }

            return secureUrlElement.GetString() ?? throw new ServiceUnavailableException("Cloudinary secure_url is empty.");
        }
    }

    private async Task<string> UploadToLocalStorageAsync(
        Guid userId,
        IFormFile file,
        string mediaType,
        CancellationToken cancellationToken)
    {
        _logger.LogWarning(
            "Cloudinary is not configured. Story upload is using local file storage fallback for user {UserId}.",
            userId);

        var webRootPath = _webHostEnvironment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
        }

        var relativeDirectory = Path.Combine("uploads", "stories", userId.ToString("D"));
        var targetDirectory = Path.Combine(webRootPath, relativeDirectory);
        Directory.CreateDirectory(targetDirectory);

        var extension = GetSafeExtension(file.FileName, mediaType);
        var fileName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}{extension}";
        var targetPath = Path.Combine(targetDirectory, fileName);

        await using (var stream = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return $"/uploads/stories/{userId:D}/{fileName}";
    }

    private static string? TryExtractCloudinaryError(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(payload);
            if (document.RootElement.TryGetProperty("error", out var errorElement)
                && errorElement.ValueKind == JsonValueKind.Object
                && errorElement.TryGetProperty("message", out var messageElement)
                && messageElement.ValueKind == JsonValueKind.String)
            {
                return messageElement.GetString();
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    private static string GenerateCloudinarySignature(
        SortedDictionary<string, string> parametersToSign,
        string apiSecret)
    {
        var serializedParameters = string.Join(
            "&",
            parametersToSign.Select(pair => $"{pair.Key}={pair.Value}"));

        using var sha1 = SHA1.Create();
        var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes($"{serializedParameters}{apiSecret}"));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static bool IsCloudinaryConfigured(CloudinaryOptions options)
    {
        return !string.IsNullOrWhiteSpace(options.CloudName)
            && !string.IsNullOrWhiteSpace(options.ApiKey)
            && !string.IsNullOrWhiteSpace(options.ApiSecret)
            && !string.IsNullOrWhiteSpace(options.UploadPreset);
    }

    private static string BuildStoryUploadFolder(string configuredFolder, Guid userId)
    {
        var normalizedRoot = string.IsNullOrWhiteSpace(configuredFolder)
            ? "fookbase"
            : configuredFolder.Trim().Trim('/');

        return $"{normalizedRoot}/stories/{userId:D}";
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

    private static string ResolveMediaType(IFormFile file)
    {
        if (file is null || file.Length <= 0)
        {
            throw new ArgumentException("Story file is required.");
        }

        var contentType = file.ContentType?.Trim() ?? string.Empty;
        if (AllowedImageContentTypes.Contains(contentType))
        {
            return StoryMediaTypeImage;
        }

        if (AllowedVideoContentTypes.Contains(contentType))
        {
            return StoryMediaTypeVideo;
        }

        var extension = Path.GetExtension(file.FileName);
        if (AllowedImageExtensions.Contains(extension))
        {
            return StoryMediaTypeImage;
        }

        if (AllowedVideoExtensions.Contains(extension))
        {
            return StoryMediaTypeVideo;
        }

        throw new ArgumentException("Only image/video files are allowed for story upload.");
    }

    private static string GetSafeExtension(string fileName, string mediaType)
    {
        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            return mediaType == StoryMediaTypeImage ? ".jpg" : ".mp4";
        }

        if (AllowedImageExtensions.Contains(extension) || AllowedVideoExtensions.Contains(extension))
        {
            return extension.ToLowerInvariant();
        }

        return mediaType == StoryMediaTypeImage ? ".jpg" : ".mp4";
    }

    private static void ValidateFileSize(IFormFile file, string mediaType)
    {
        var maxSize = mediaType == StoryMediaTypeImage ? MaxImageBytes : MaxVideoBytes;
        if (file.Length > maxSize)
        {
            var maxSizeMb = maxSize / (1024 * 1024);
            throw new ArgumentException($"Story file is too large. Maximum allowed size is {maxSizeMb}MB for {mediaType.ToLowerInvariant()}.");
        }
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
