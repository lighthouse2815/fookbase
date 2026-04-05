using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaApiService : IJavaApiService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly JavaApiOptions _options;
    private readonly ILogger<JavaApiService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public JavaApiService(
        HttpClient httpClient,
        IOptions<JavaApiOptions> options,
        ILogger<JavaApiService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<UserDto?> GetUserById(
        Guid id,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = BuildPath(_options.UserByIdPathTemplate, ("id", id));
        return GetAsync<UserDto>(path, accessToken, cancellationToken);
    }

    public Task<UserProfileDto?> GetProfileByUserId(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = BuildPath(_options.ProfileByUserIdPathTemplate, ("userId", userId));
        return GetAsync<UserProfileDto>(path, accessToken, cancellationToken);
    }

    public Task<UserProfileSummaryDto?> GetProfileSummaryByUserId(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = BuildPath(_options.ProfileSummaryByUserIdPathTemplate, ("userId", userId));
        return GetAsync<UserProfileSummaryDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<UserProfilePrivateDto>> GetPrivateProfileByUserIdAsync(
        Guid userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.ProfilePrivateByUserIdPathTemplate, ("userId", userId));
        return GetResultAsync<UserProfilePrivateDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<UserProfileOverviewDto>> GetMyProfileOverviewAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.ProfileMeOverviewPathTemplate);
        return GetResultAsync<UserProfileOverviewDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<object?>> UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.ProfileMeUpdatePathTemplate);
        return PatchNoContentAsync(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<UserProfileSearchDto>> SearchProfileByPhoneNumberAsync(
        string phoneNumber,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.ProfileSearchByPhonePathTemplate, ("phoneNumber", phoneNumber));
        return GetResultAsync<UserProfileSearchDto>(path, accessToken, cancellationToken);
    }

    public async Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = BuildPath(_options.FriendsByUserIdPathTemplate, ("userId", userId));
        var friends = await GetAsync<List<FriendshipDto>>(path, accessToken, cancellationToken);
        return friends ?? new List<FriendshipDto>();
    }

    public async Task<JavaApiCallResult<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(
        string accessToken,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePage = page < 0 ? 0 : page;
        var safePageSize = pageSize <= 0 ? 20 : pageSize;
        var path = BuildPath(_options.UserSuggestionsPathTemplate, ("page", safePage), ("size", safePageSize));
        var result = await GetResultAsync<List<FriendSuggestionDto>>(path, accessToken, cancellationToken);

        if (result.IsSuccess && result.Data is null)
        {
            return JavaApiCallResult<List<FriendSuggestionDto>>.Success(new List<FriendSuggestionDto>(), result.StatusCode);
        }

        return result;
    }

    public async Task<JavaApiCallResult<List<PendingFriendRequesterDto>>> GetPendingRequestersAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerPendingRequestersPathTemplate);
        var result = await GetResultAsync<List<PendingFriendRequesterDto>>(path, accessToken, cancellationToken);

        if (result.IsSuccess && result.Data is null)
        {
            return JavaApiCallResult<List<PendingFriendRequesterDto>>.Success(new List<PendingFriendRequesterDto>(), result.StatusCode);
        }

        return result;
    }

    public async Task<JavaApiCallResult<List<ContactDto>>> GetContactsByUserAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerContactsByUserPathTemplate);
        var result = await GetResultAsync<List<ContactDto>>(path, accessToken, cancellationToken);

        if (result.IsSuccess && result.Data is null)
        {
            return JavaApiCallResult<List<ContactDto>>.Success(new List<ContactDto>(), result.StatusCode);
        }

        return result;
    }

    public Task<JavaApiCallResult<FriendshipResponseDto>> SendFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerSendFriendRequestPathTemplate);
        return PostAsync<FriendshipResponseDto>(
            path,
            new { userId, addresseeId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<FriendshipResponseDto>> AcceptFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerAcceptFriendRequestPathTemplate);
        return PostAsync<FriendshipResponseDto>(
            path,
            new { userId, requestId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<object?>> RejectFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerRejectFriendRequestPathTemplate);
        return PostNoContentAsync(
            path,
            new { userId, requestId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<object?>> UnfriendAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.MessengerUnfriendPathTemplate);
        return DeleteNoContentAsync(
            path,
            new { userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<RegisterResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthRegisterPathTemplate);
        return PostAsync<RegisterResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthLoginPathTemplate);
        return PostAsync<LoginResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthSendVerifyEmailOtpWhenNotLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthSendVerifyEmailOtpWhenLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthSendResetPasswordOtpWhenNotLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthSendResetPasswordOtpWhenLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthVerifyEmailOtpWhenNotLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthVerifyEmailOtpWhenLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthVerifyResetPasswordOtpWhenNotLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthVerifyResetPasswordOtpWhenLoginPathTemplate);
        return PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<MessageResponseDto>> ResetPasswordAsync(
        string resetToken,
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = BuildPath(_options.AuthResetPasswordPathTemplate);
        var additionalHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["X-Reset-Token"] = resetToken
        };

        return PostAsync<MessageResponseDto>(path, request, cancellationToken, additionalHeaders: additionalHeaders);
    }

    private async Task<T?> GetAsync<T>(string relativePath, string? accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, relativePath);
        var resolvedAccessToken = ResolveAccessToken(accessToken);

        if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return default;
        }

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                relativePath,
                (int)response.StatusCode,
                body);

            throw new HttpRequestException(
                $"Java API call to '{relativePath}' failed with status code {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        var bodyText = await response.Content.ReadAsStringAsync(cancellationToken);
        return DeserializePayload<T>(bodyText);
    }

    private async Task<JavaApiCallResult<T>> GetResultAsync<T>(
        string relativePath,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, relativePath);
            var resolvedAccessToken = ResolveAccessToken(accessToken);

            if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseStatusCode = (int)response.StatusCode;
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = ExtractErrorMessage(body)
                    ?? $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.";

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return JavaApiCallResult<T>.Failure(responseStatusCode, errorMessage);
            }

            var data = DeserializePayload<T>(body);
            if (data is null)
            {
                _logger.LogWarning(
                    "Java API call returned empty response body. Path: {Path}, StatusCode: {StatusCode}",
                    relativePath,
                    responseStatusCode);

                return JavaApiCallResult<T>.Failure(
                    StatusCodes.Status502BadGateway,
                    "Java API returned an empty response.");
            }

            return JavaApiCallResult<T>.Success(data, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status504GatewayTimeout,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status502BadGateway,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java API is unavailable.");
        }
    }

    private async Task<JavaApiCallResult<T>> PostAsync<T>(
        string relativePath,
        object? payload,
        CancellationToken cancellationToken,
        string? accessToken = null,
        IReadOnlyDictionary<string, string>? additionalHeaders = null)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, relativePath);
            var resolvedAccessToken = ResolveAccessToken(accessToken);
            if (payload is not null)
            {
                request.Content = JsonContent.Create(payload, options: SerializerOptions);
            }

            if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
            }

            if (additionalHeaders is not null)
            {
                foreach (var (key, value) in additionalHeaders)
                {
                    request.Headers.TryAddWithoutValidation(key, value);
                }
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseStatusCode = (int)response.StatusCode;
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = ExtractErrorMessage(body)
                    ?? $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.";

                _logger.LogWarning(
                    "Java API auth call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return JavaApiCallResult<T>.Failure(responseStatusCode, errorMessage);
            }

            var data = DeserializePayload<T>(body);
            if (data is null)
            {
                _logger.LogWarning(
                    "Java API auth call returned empty response body. Path: {Path}, StatusCode: {StatusCode}",
                    relativePath,
                    responseStatusCode);

                return JavaApiCallResult<T>.Failure(
                    StatusCodes.Status502BadGateway,
                    "Java auth API returned an empty response.");
            }

            return JavaApiCallResult<T>.Success(data, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API auth call timed out. Path: {Path}", relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status504GatewayTimeout,
                "Java auth API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API auth call returned malformed payload. Path: {Path}",
                relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status502BadGateway,
                "Java auth API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API auth call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java auth API is unavailable.");
        }
    }

    private async Task<JavaApiCallResult<object?>> PostNoContentAsync(
        string relativePath,
        object? payload,
        CancellationToken cancellationToken,
        string? accessToken = null,
        IReadOnlyDictionary<string, string>? additionalHeaders = null)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, relativePath);
            var resolvedAccessToken = ResolveAccessToken(accessToken);
            if (payload is not null)
            {
                request.Content = JsonContent.Create(payload, options: SerializerOptions);
            }

            if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
            }

            if (additionalHeaders is not null)
            {
                foreach (var (key, value) in additionalHeaders)
                {
                    request.Headers.TryAddWithoutValidation(key, value);
                }
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseStatusCode = (int)response.StatusCode;
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = ExtractErrorMessage(body)
                    ?? $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.";

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return JavaApiCallResult<object?>.Failure(responseStatusCode, errorMessage);
            }

            return JavaApiCallResult<object?>.Success(data: null, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status504GatewayTimeout,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status502BadGateway,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java API is unavailable.");
        }
    }

    private async Task<JavaApiCallResult<object?>> DeleteNoContentAsync(
        string relativePath,
        object? payload,
        CancellationToken cancellationToken,
        string? accessToken = null,
        IReadOnlyDictionary<string, string>? additionalHeaders = null)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Delete, relativePath);
            var resolvedAccessToken = ResolveAccessToken(accessToken);
            if (payload is not null)
            {
                request.Content = JsonContent.Create(payload, options: SerializerOptions);
            }

            if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
            }

            if (additionalHeaders is not null)
            {
                foreach (var (key, value) in additionalHeaders)
                {
                    request.Headers.TryAddWithoutValidation(key, value);
                }
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseStatusCode = (int)response.StatusCode;
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = ExtractErrorMessage(body)
                    ?? $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.";

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return JavaApiCallResult<object?>.Failure(responseStatusCode, errorMessage);
            }

            return JavaApiCallResult<object?>.Success(data: null, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status504GatewayTimeout,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status502BadGateway,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java API is unavailable.");
        }
    }

    private async Task<JavaApiCallResult<object?>> PatchNoContentAsync(
        string relativePath,
        object? payload,
        CancellationToken cancellationToken,
        string? accessToken = null,
        IReadOnlyDictionary<string, string>? additionalHeaders = null)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Patch, relativePath);
            var resolvedAccessToken = ResolveAccessToken(accessToken);
            if (payload is not null)
            {
                request.Content = JsonContent.Create(payload, options: SerializerOptions);
            }

            if (!string.IsNullOrWhiteSpace(resolvedAccessToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", resolvedAccessToken);
            }

            if (additionalHeaders is not null)
            {
                foreach (var (key, value) in additionalHeaders)
                {
                    request.Headers.TryAddWithoutValidation(key, value);
                }
            }

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseStatusCode = (int)response.StatusCode;
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = ExtractErrorMessage(body)
                    ?? $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.";

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return JavaApiCallResult<object?>.Failure(responseStatusCode, errorMessage);
            }

            return JavaApiCallResult<object?>.Success(data: null, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status504GatewayTimeout,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status502BadGateway,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<object?>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java API is unavailable.");
        }
    }

    private static T? DeserializePayload<T>(string bodyText)
    {
        if (string.IsNullOrWhiteSpace(bodyText))
        {
            return default;
        }

        using var document = JsonDocument.Parse(bodyText);
        var root = document.RootElement;

        if (root.ValueKind == JsonValueKind.Object)
        {
            if (root.TryGetProperty("data", out var dataElement))
            {
                return DeserializeElement<T>(dataElement);
            }

            if (root.TryGetProperty("result", out var resultElement))
            {
                // Some Java endpoints return { "result": "<message>" } where "result" is a real field,
                // not an envelope wrapper. Only unwrap when "result" itself is a complex payload.
                if (resultElement.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    return DeserializeElement<T>(resultElement);
                }
            }
        }

        return JsonSerializer.Deserialize<T>(root.GetRawText(), SerializerOptions);
    }

    private static string? ExtractErrorMessage(string bodyText)
    {
        if (string.IsNullOrWhiteSpace(bodyText))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(bodyText);
            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (root.TryGetProperty("message", out var messageElement)
                && messageElement.ValueKind == JsonValueKind.String)
            {
                return messageElement.GetString();
            }

            if (root.TryGetProperty("error", out var errorElement)
                && errorElement.ValueKind == JsonValueKind.String)
            {
                return errorElement.GetString();
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    private static T? DeserializeElement<T>(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(element.GetRawText(), SerializerOptions);
    }

    private static string BuildPath(string template, params (string Key, object Value)[] replacements)
    {
        var path = template;

        foreach (var (key, value) in replacements)
        {
            var token = $"{{{key}}}";
            path = path.Replace(token, Uri.EscapeDataString(value.ToString() ?? string.Empty), StringComparison.Ordinal);
        }

        return path.TrimStart('/');
    }

    private string? ResolveAccessToken(string? accessToken)
    {
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            return accessToken.Trim();
        }

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return null;
        }

        var authorizationHeader = httpContext.Request.Headers.Authorization.ToString();
        if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authorizationHeader["Bearer ".Length..].Trim();
        }

        if (httpContext.Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken.Trim();
        }

        return null;
    }
}
