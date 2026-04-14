using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICurrentUserService
{
    Task<JavaApiCallResult<CurrentUserResponseDto>> GetCurrentUserAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<SecurityAccountInfoResponseDto>> GetSecurityAccountInfoAsync(
        Guid userId,
        string? accessToken,
        string? usernameFromClaims,
        CancellationToken cancellationToken);
}
