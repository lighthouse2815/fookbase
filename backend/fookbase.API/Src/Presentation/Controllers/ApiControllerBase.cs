using System.Diagnostics.CodeAnalysis;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult<ApiResponse<T>> BuildErrorResponse<T>(
        JavaApiCallResult<T> result,
        string fallbackError)
    {
        return BuildErrorResponse<T>(result.StatusCode, result.ErrorMessage, fallbackError);
    }

    protected ActionResult<ApiResponse<T>> BuildErrorResponse<T>(
        int statusCode,
        string? errorMessage,
        string fallbackError)
    {
        var resolvedStatusCode = statusCode > 0
            ? statusCode
            : StatusCodes.Status502BadGateway;

        var resolvedError = string.IsNullOrWhiteSpace(errorMessage)
            ? fallbackError
            : errorMessage;

        return StatusCode(resolvedStatusCode, ApiResponse<T>.Fail(resolvedError));
    }

    protected static int ResolveSuccessStatusCode(int statusCode)
    {
        return statusCode > 0
            ? statusCode
            : StatusCodes.Status200OK;
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
        return Unauthorized(ApiResponse<T>.Fail(message));
    }

    protected Guid GetCurrentUserId()
    {
        return User.GetUserId();
    }

    protected Guid? TryGetCurrentUserId()
    {
        return User.Identity?.IsAuthenticated == true
            ? User.GetUserId()
            : null;
    }
}
