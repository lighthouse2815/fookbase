using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAuthCookieService
{
    void SetLoginCookies(HttpContext context, string token);

    void ClearLoginCookies(HttpContext context);
}
