using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaCurrentUserApiService
{
    Task<JavaApiCallResult<UserSecurityPrivateDto>> GetMySecurityPrivateProfileAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> UpdateMySecurityPrivateProfileAsync(
        string resetToken,
        UpdateSecurityAccountRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);
}



