using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserProfilePublicReadModelService
{
    Task<JavaApiCallResult<UserProfileDto>> GetByUserIdAsync(
        Guid requesterUserId,
        Guid targetUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false);
}
