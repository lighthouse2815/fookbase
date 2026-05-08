using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Models;

namespace InteractHub.Api.Common.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            if (exception is BusinessException businessException)
            {
                _logger.LogWarning(
                    "Business exception occurred. Code={ErrorCode}, Message={Message}",
                    businessException.ErrorCode,
                    businessException.Message);
            }
            else
            {
                _logger.LogError(exception, "Unhandled exception occurred.");
            }

            await WriteErrorResponseAsync(context, exception);
        }
    }

    private static Task WriteErrorResponseAsync(HttpContext context, Exception exception)
    {
        var error = ApiErrorFactory.FromException(context, exception);

        context.Response.StatusCode = error.Status;
        context.Response.ContentType = "application/json";

        return context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(error));
    }
}
