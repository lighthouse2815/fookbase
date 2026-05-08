namespace InteractHub.Api.Application.DTOs.JavaApi;

public class JavaApiCallResult<T>
{
    public bool IsSuccess { get; init; }

    public int StatusCode { get; init; }

    public T? Data { get; init; }

    public string? ErrorMessage { get; init; }

    public string? ErrorCode { get; init; }

    public static JavaApiCallResult<T> Success(T? data, int statusCode)
    {
        return new JavaApiCallResult<T>
        {
            IsSuccess = true,
            StatusCode = statusCode,
            Data = data,
            ErrorMessage = null,
            ErrorCode = null
        };
    }

    public static JavaApiCallResult<T> Failure(int statusCode, string errorMessage, string? errorCode = null)
    {
        return new JavaApiCallResult<T>
        {
            IsSuccess = false,
            StatusCode = statusCode,
            Data = default,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };
    }
}
