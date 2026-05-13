using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Common.Utilities;

public static class JavaApiResultHelper
{
    public static JavaApiCallResult<TDestination> Unauthorized<TDestination>(
        string errorMessage = "Unauthorized.",
        string? errorCode = null)
    {
        return JavaApiCallResult<TDestination>.Failure(
            StatusCodes.Status401Unauthorized,
            errorMessage,
            errorCode);
    }

    public static JavaApiCallResult<TDestination> BadRequest<TDestination>(
        string errorMessage,
        string? errorCode = null)
    {
        return JavaApiCallResult<TDestination>.Failure(
            StatusCodes.Status400BadRequest,
            errorMessage,
            errorCode);
    }

    public static int ResolveStatusCode(int statusCode, int fallbackStatusCode)
    {
        return statusCode > 0
            ? statusCode
            : fallbackStatusCode;
    }

    public static int ResolveSuccessStatusCode(int statusCode)
    {
        return ResolveStatusCode(statusCode, StatusCodes.Status200OK);
    }

    public static string ResolveErrorMessage(string? errorMessage, string fallbackErrorMessage)
    {
        return string.IsNullOrWhiteSpace(errorMessage)
            ? fallbackErrorMessage
            : errorMessage;
    }

    public static JavaApiCallResult<TDestination> BuildFailure<TDestination>(
        int statusCode,
        string? errorMessage,
        string fallbackErrorMessage,
        int fallbackStatusCode = StatusCodes.Status502BadGateway,
        string? errorCode = null)
    {
        return JavaApiCallResult<TDestination>.Failure(
            ResolveStatusCode(statusCode, fallbackStatusCode),
            ResolveErrorMessage(errorMessage, fallbackErrorMessage),
            errorCode);
    }

    public static void EnsureSuccessOrThrow<T>(
        JavaApiCallResult<T> result,
        string fallbackErrorMessage,
        int fallbackStatusCode = StatusCodes.Status502BadGateway)
    {
        if (result.IsSuccess)
        {
            return;
        }

        var resolvedStatusCode = ResolveStatusCode(result.StatusCode, fallbackStatusCode);
        var resolvedMessage = ResolveErrorMessage(result.ErrorMessage, fallbackErrorMessage);
        var resolvedErrorCode = ResolveBusinessErrorCode(result.ErrorCode, resolvedStatusCode);

        throw new BusinessException(
            resolvedErrorCode,
            resolvedMessage,
            new Dictionary<string, object?>
            {
                ["upstreamStatusCode"] = resolvedStatusCode,
                ["upstreamErrorCode"] = result.ErrorCode
            });
    }

    public static T EnsureSuccessAndDataOrThrow<T>(
        JavaApiCallResult<T> result,
        string fallbackErrorMessage,
        string? emptyDataErrorMessage = null,
        ErrorCode emptyDataErrorCode = ErrorCode.UPSTREAM_SERVICE_ERROR,
        int fallbackStatusCode = StatusCodes.Status502BadGateway)
    {
        EnsureSuccessOrThrow(result, fallbackErrorMessage, fallbackStatusCode);

        if (result.Data is not null)
        {
            return result.Data;
        }

        throw new BusinessException(
            emptyDataErrorCode,
            string.IsNullOrWhiteSpace(emptyDataErrorMessage)
                ? "Java API returned empty response data."
                : emptyDataErrorMessage);
    }

    private static ErrorCode ResolveBusinessErrorCode(string? upstreamErrorCode, int upstreamStatusCode)
    {
        if (!string.IsNullOrWhiteSpace(upstreamErrorCode)
            && Enum.TryParse<ErrorCode>(upstreamErrorCode, ignoreCase: true, out var parsedErrorCode))
        {
            return parsedErrorCode;
        }

        return upstreamStatusCode switch
        {
            StatusCodes.Status400BadRequest => ErrorCode.VALIDATION_ERROR,
            StatusCodes.Status401Unauthorized => ErrorCode.UNAUTHORIZED,
            StatusCodes.Status403Forbidden => ErrorCode.FORBIDDEN,
            StatusCodes.Status404NotFound => ErrorCode.NOT_FOUND,
            StatusCodes.Status502BadGateway
                or StatusCodes.Status503ServiceUnavailable
                or StatusCodes.Status504GatewayTimeout => ErrorCode.UPSTREAM_SERVICE_ERROR,
            >= StatusCodes.Status500InternalServerError => ErrorCode.SERVICE_UNAVAILABLE,
            _ => ErrorCode.REQUEST_FAILED
        };
    }
}
