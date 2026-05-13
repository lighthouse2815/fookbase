using InteractHub.Api.Application.DTOs.Common;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaApiTransport
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger _logger;
    private readonly IAccessTokenProvider _accessTokenProvider;

    public JavaApiTransport(
        HttpClient httpClient,
        ILogger logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _httpClient = httpClient;
        _logger = logger;
        _accessTokenProvider = accessTokenProvider;
    }

    public async Task<T?> GetAsync<T>(
        string relativePath,
        string? accessToken,
        CancellationToken cancellationToken)
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

    public async Task<JavaApiCallResult<T>> GetResultAsync<T>(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<T>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            var data = DeserializePayload<T>(body);
            if (data is null)
            {
                _logger.LogWarning(
                    "Java API call returned empty response body. Path: {Path}, StatusCode: {StatusCode}",
                    relativePath,
                    responseStatusCode);

                return BuildUpstreamFailure<T>(
                    StatusCodes.Status502BadGateway,
                    errorMessage: null,
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
            return BuildUpstreamFailure<T>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<T>> PostAsync<T>(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API auth call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<T>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            var data = DeserializePayload<T>(body);
            if (data is null)
            {
                _logger.LogWarning(
                    "Java API auth call returned empty response body. Path: {Path}, StatusCode: {StatusCode}",
                    relativePath,
                    responseStatusCode);

                return BuildUpstreamFailure<T>(
                    StatusCodes.Status502BadGateway,
                    errorMessage: null,
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
            return BuildUpstreamFailure<T>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java auth API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API auth call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java auth API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API auth call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java auth API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<NoContentDto>> PostNoContentAsync(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<NoContentDto>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            return JavaApiCallResult<NoContentDto>.Success(data: NoContentDto.Instance, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<NoContentDto>> DeleteNoContentAsync(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<NoContentDto>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            return JavaApiCallResult<NoContentDto>.Success(data: NoContentDto.Instance, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<NoContentDto>> PatchNoContentAsync(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<NoContentDto>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            return JavaApiCallResult<NoContentDto>.Success(data: NoContentDto.Instance, responseStatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogError(exception, "Java API call timed out. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<NoContentDto>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<T>> PatchAsync<T>(
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
                var javaError = ExtractError(body);

                _logger.LogWarning(
                    "Java API call failed. Path: {Path}, StatusCode: {StatusCode}, Body: {Body}",
                    relativePath,
                    responseStatusCode,
                    body);

                return BuildUpstreamFailure<T>(
                    responseStatusCode,
                    javaError.Message,
                    $"Java API call to '{relativePath}' failed with status code {responseStatusCode}.",
                    javaError.Code);
            }

            var data = DeserializePayload<T>(body);
            if (data is null)
            {
                _logger.LogWarning(
                    "Java API call returned empty response body. Path: {Path}, StatusCode: {StatusCode}",
                    relativePath,
                    responseStatusCode);

                return BuildUpstreamFailure<T>(
                    StatusCodes.Status502BadGateway,
                    errorMessage: null,
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
            return BuildUpstreamFailure<T>(
                StatusCodes.Status504GatewayTimeout,
                errorMessage: null,
                "Java API timed out.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Java API call returned malformed payload. Path: {Path}",
                relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status502BadGateway,
                errorMessage: null,
                "Java API returned malformed payload.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java API call failed due to transport error. Path: {Path}", relativePath);
            return BuildUpstreamFailure<T>(
                StatusCodes.Status503ServiceUnavailable,
                errorMessage: null,
                "Java API is unavailable.");
        }
    }

    private static JavaApiCallResult<T> BuildUpstreamFailure<T>(
        int statusCode,
        string? errorMessage,
        string fallbackErrorMessage,
        string? errorCode = null)
    {
        return JavaApiResultHelper.BuildFailure<T>(
            statusCode,
            errorMessage,
            fallbackErrorMessage,
            fallbackStatusCode: StatusCodes.Status502BadGateway,
            errorCode: errorCode);
    }

    public static string BuildPath(string template, params (string Key, object Value)[] replacements)
    {
        var path = template;

        foreach (var (key, value) in replacements)
        {
            var token = $"{{{key}}}";
            path = path.Replace(token, Uri.EscapeDataString(value.ToString() ?? string.Empty), StringComparison.Ordinal);
        }

        return path.TrimStart('/');
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
                if (resultElement.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    return DeserializeElement<T>(resultElement);
                }
            }
        }

        return JsonSerializer.Deserialize<T>(root.GetRawText(), SerializerOptions);
    }

    private static (string? Code, string? Message) ExtractError(string bodyText)
    {
        if (string.IsNullOrWhiteSpace(bodyText))
        {
            return (null, null);
        }

        try
        {
            using var document = JsonDocument.Parse(bodyText);
            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
            {
                return (null, null);
            }

            string? code = null;
            string? message = null;

            if (root.TryGetProperty("error", out var errorElement)
                && errorElement.ValueKind == JsonValueKind.String)
            {
                code = errorElement.GetString();
            }

            if (root.TryGetProperty("message", out var messageElement)
                && messageElement.ValueKind == JsonValueKind.String)
            {
                message = messageElement.GetString();
            }

            return (code, message ?? code);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    private static T? DeserializeElement<T>(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(element.GetRawText(), SerializerOptions);
    }

    private string? ResolveAccessToken(string? accessToken)
    {
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            return accessToken.NormalizeAccessTokenOrNull();
        }

        return _accessTokenProvider.GetAccessTokenOrNull();
    }
}







