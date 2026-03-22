namespace InteractHub.Api.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; init; }

    public T? Data { get; init; }

    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static ApiResponse<T> Ok(T data)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Errors = Array.Empty<string>()
        };
    }

    public static ApiResponse<T> Fail(IEnumerable<string> errors)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Data = default,
            Errors = errors.Where(error => !string.IsNullOrWhiteSpace(error)).ToList()
        };
    }

    public static ApiResponse<T> Fail(string error)
    {
        return Fail(new[] { error });
    }
}