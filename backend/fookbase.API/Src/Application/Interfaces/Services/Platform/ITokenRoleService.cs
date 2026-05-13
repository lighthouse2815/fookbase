namespace InteractHub.Api.Application.Interfaces.Services;

public interface ITokenRoleService
{
    bool IsAdmin(string? roleHint, string? token);
}



