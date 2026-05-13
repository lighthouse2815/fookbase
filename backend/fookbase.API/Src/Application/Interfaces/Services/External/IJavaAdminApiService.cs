using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaAdminApiService
{
    Task<JavaApiCallResult<List<AdminUserSearchDto>>> SearchAdminUsersAsync(
        string? keyword,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<AdminUserSearchDto>> UpdateAdminUserStatusAsync(
        Guid userId,
        UserStatus status,
        string? accessToken = null,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<AdminUserStatsDto>> GetAdminUserStatsAsync(
        string accessToken,
        CancellationToken cancellationToken = default);
}



