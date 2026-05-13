using InteractHub.Api.Application.DTOs.Admin;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAdminConsoleService
{
    Task<IReadOnlyList<AdminUserSearchResponseDto>> SearchUsersAsync(
        string? keyword,
        CancellationToken cancellationToken);

    Task<AdminUserSearchResponseDto> UpdateUserStatusAsync(
        Guid adminUserId,
        Guid targetUserId,
        UpdateAdminUserStatusRequestDto request,
        CancellationToken cancellationToken);

    Task<AdminDashboardResponseDto> GetDashboardAsync(
        CancellationToken cancellationToken);
}




