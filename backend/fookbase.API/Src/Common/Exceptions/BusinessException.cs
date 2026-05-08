using InteractHub.Api.Common.Enums;

namespace InteractHub.Api.Common.Exceptions;

public sealed class BusinessException : Exception
{
    public BusinessException(
        ErrorCode errorCode,
        string? message = null,
        IReadOnlyDictionary<string, object?>? data = null)
        : base(string.IsNullOrWhiteSpace(message) ? errorCode.GetDefaultMessage() : message)
    {
        ErrorCode = errorCode;
        StatusCode = errorCode.GetStatusCode();
        ErrorData = data;
    }

    public ErrorCode ErrorCode { get; }

    public int StatusCode { get; }

    public IReadOnlyDictionary<string, object?>? ErrorData { get; }
}
