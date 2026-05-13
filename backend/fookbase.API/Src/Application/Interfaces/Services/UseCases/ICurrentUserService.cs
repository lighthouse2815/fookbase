using InteractHub.Api.Application.DTOs.Users;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICurrentUserService
{
    Task<CurrentUserResponseDto> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<SecurityAccountInfoResponseDto> GetSecurityAccountInfoAsync(
        Guid userId,
        string? usernameFromClaims,
        CancellationToken cancellationToken);

    Task UpdateSecurityAccountInfoAsync(
        string? resetToken,
        UpdateSecurityAccountRequestDto request,
        CancellationToken cancellationToken);
}





