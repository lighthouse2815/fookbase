using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaApiService
{
    Task<UserDto?> GetUserById(
        Guid id,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<UserProfileDto?> GetProfileByUserId(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<JavaApiCallResult<RegisterResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default);
}
