using System.Diagnostics.CodeAnalysis;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult<ApiResponse<T>> BuildErrorResponse<T>(
        JavaApiCallResult<T> result,
        string fallbackError)
    {
        return BuildErrorResponse<T>(result.StatusCode, result.ErrorMessage, fallbackError, result.ErrorCode);
    }

    protected ActionResult<ApiResponse<T>> BuildErrorResponse<T>(
        int statusCode,
        string? errorMessage,
        string fallbackError,
        string? errorCode = null)
    {
        var resolvedStatusCode = JavaApiResultHelper.ResolveStatusCode(
            statusCode,
            StatusCodes.Status502BadGateway);

        var resolvedError = JavaApiResultHelper.ResolveErrorMessage(
            errorMessage,
            fallbackError);

        var resolvedErrorCode = string.IsNullOrWhiteSpace(errorCode)
            ? ErrorCode.UPSTREAM_SERVICE_ERROR.ToString()
            : errorCode;

        return ErrorResponse<T>(resolvedErrorCode, resolvedStatusCode, resolvedError);
    }

    protected static int ResolveSuccessStatusCode(int statusCode)
    {
        return JavaApiResultHelper.ResolveSuccessStatusCode(statusCode);
    }

    protected string? ExtractAccessToken()
    {
        return Request.ExtractAccessToken();
    }

    protected bool TryExtractAccessToken([NotNullWhen(true)] out string accessToken)
    {
        accessToken = Request.ExtractAccessToken() ?? string.Empty;
        return !string.IsNullOrWhiteSpace(accessToken);
    }

    protected ActionResult<ApiResponse<T>> UnauthorizedApiResponse<T>(string message = "Unauthorized.")
    {
        return ErrorResponse<T>(ErrorCode.UNAUTHORIZED, StatusCodes.Status401Unauthorized, message);
    }

    protected ActionResult<ApiResponse<T>> ErrorResponse<T>(
        ErrorCode errorCode,
        int statusCode,
        string message,
        IReadOnlyDictionary<string, object?>? data = null)
    {
        return ErrorResponse<T>(errorCode.ToString(), statusCode, message, data);
    }

    protected ActionResult<ApiResponse<T>> ErrorResponse<T>(
        string errorCode,
        int statusCode,
        string message,
        IReadOnlyDictionary<string, object?>? data = null)
    {
        var error = ApiError.Create(errorCode, statusCode, message, Request.Path.Value, data);
        return StatusCode(statusCode, ApiResponse<T>.Fail(error));
    }

    protected Guid GetCurrentUserId()
    {
        return User.GetUserId();
    }

    protected Guid? TryGetCurrentUserId()
    {
        return User.TryGetUserId(out var userId) ? userId : null;
    }
}

