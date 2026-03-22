using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
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

    public JavaApiService(
        HttpClient httpClient,
        IOptions<JavaApiOptions> options,
        ILogger<JavaApiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
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

    public async Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = BuildPath(_options.FriendsByUserIdPathTemplate, ("userId", userId));
        var friends = await GetAsync<List<FriendshipDto>>(path, accessToken, cancellationToken);
        return friends ?? new List<FriendshipDto>();
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

    private async Task<T?> GetAsync<T>(string relativePath, string? accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, relativePath);

        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
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

    private async Task<JavaApiCallResult<T>> PostAsync<T>(
        string relativePath,
        object payload,
        CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _httpClient.PostAsJsonAsync(relativePath, payload, SerializerOptions, cancellationToken);
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
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API auth call failed due to transport error. Path: {Path}", relativePath);
            return JavaApiCallResult<T>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java auth API is unavailable.");
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
                return DeserializeElement<T>(resultElement);
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
}
