using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;

namespace InteractHub.Api.Common.Models;

public static class ApiErrorFactory
{
    public static ApiError FromException(HttpContext context, Exception exception)
    {
        string path = context.Request.Path.Value ?? string.Empty;

        return exception switch
        {
            BusinessException businessException => ApiError.Create(
                businessException.ErrorCode,
                businessException.StatusCode,
                businessException.Message,
                path,
                businessException.ErrorData),

            UnauthorizedAccessException => ApiError.Create(
                ErrorCode.UNAUTHORIZED,
                StatusCodes.Status401Unauthorized,
                ResolveMessage(exception.Message, "Unauthorized."),
                path),

            ArgumentException => ApiError.Create(
                ErrorCode.VALIDATION_ERROR,
                StatusCodes.Status400BadRequest,
                ResolveMessage(exception.Message, "Invalid request."),
                path),

            InvalidOperationException => ApiError.Create(
                ErrorCode.BUSINESS_RULE_VIOLATION,
                StatusCodes.Status400BadRequest,
                ResolveMessage(exception.Message, "Request cannot be completed."),
                path),

            _ => ApiError.Create(
                ErrorCode.INTERNAL_ERROR,
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.",
                path)
        };
    }

    private static string ResolveMessage(string? message, string fallback)
    {
        return string.IsNullOrWhiteSpace(message)
            ? fallback
            : message;
    }
}
