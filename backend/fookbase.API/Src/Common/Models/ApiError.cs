using InteractHub.Api.Common.Enums;
using System.Text.Json.Serialization;

namespace InteractHub.Api.Common.Models;

public sealed class ApiError
{
    public string Code { get; init; } = ErrorCode.REQUEST_FAILED.ToString();

    public int Status { get; init; }

    public string Message { get; init; } = string.Empty;

    public string Path { get; init; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, object?>? Data { get; init; }

    public static ApiError Create(
        ErrorCode code,
        int status,
        string message,
        string? path,
        IReadOnlyDictionary<string, object?>? data = null)
    {
        return Create(code.ToString(), status, message, path, data);
    }

    public static ApiError Create(
        string code,
        int status,
        string message,
        string? path,
        IReadOnlyDictionary<string, object?>? data = null)
    {
        return new ApiError
        {
            Code = string.IsNullOrWhiteSpace(code)
                ? ErrorCode.REQUEST_FAILED.ToString()
                : code.Trim(),
            Status = status,
            Message = message,
            Path = path ?? string.Empty,
            Data = data
        };
    }
}



