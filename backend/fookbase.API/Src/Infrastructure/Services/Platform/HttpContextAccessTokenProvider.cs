using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Infrastructure.Services;

public class HttpContextAccessTokenProvider : IAccessTokenProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextAccessTokenProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetAccessTokenOrNull()
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return null;
        }

        return request.ExtractAccessToken();
    }
}



