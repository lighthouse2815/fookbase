namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserIdentityReadModelService
{
    Task<bool> ExistsAsync(
        Guid userId,
        CancellationToken cancellationToken,
        string? accessToken = null);
}
