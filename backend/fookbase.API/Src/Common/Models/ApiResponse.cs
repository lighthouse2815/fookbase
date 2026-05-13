using InteractHub.Api.Common.Enums;
using System.Text.Json.Serialization;

namespace InteractHub.Api.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; init; }

    public T? Data { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ApiError? Error { get; init; }

    public static ApiResponse<T> Ok(T data)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Error = null
        };
    }

    public static ApiResponse<T> Fail(string error)
    {
        return Fail(ApiError.Create(
            ErrorCode.REQUEST_FAILED,
            StatusCodes.Status400BadRequest,
            error,
            string.Empty));
    }

    public static ApiResponse<T> Fail(ApiError error)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Data = default,
            Error = error
        };
    }
}



