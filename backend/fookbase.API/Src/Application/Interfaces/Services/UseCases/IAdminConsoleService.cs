using InteractHub.Api.Application.DTOs.Admin;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAdminConsoleService
{
    Task<IReadOnlyList<AdminUserSearchResponseDto>> SearchUsersAsync(
        string? keyword,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<AdminUserSearchResponseDto> UpdateUserStatusAsync(
        Guid adminUserId,
        Guid targetUserId,
        UpdateAdminUserStatusRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<AdminDashboardResponseDto> GetDashboardAsync(
        string? accessToken,
        CancellationToken cancellationToken);
}

