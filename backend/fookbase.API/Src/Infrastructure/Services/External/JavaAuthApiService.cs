using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaAuthApiService : IJavaAuthApiService
{
    private readonly JavaApiTransport _transport;
    private readonly JavaApiAuthOptions _options;

    public JavaAuthApiService(
        HttpClient httpClient,
        IOptions<JavaApiAuthOptions> options,
        ILogger<JavaAuthApiService> logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _transport = new JavaApiTransport(httpClient, logger, accessTokenProvider);
        _options = options.Value;
    }

    public Task<JavaApiCallResult<RegisterResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.RegisterPathTemplate);
        return _transport.PostAsync<RegisterResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.LoginPathTemplate);
        return _transport.PostAsync<LoginResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<GoogleAuthResponseDto>> AuthWithGoogleAsync(
        GoogleTokenRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.GooglePathTemplate);
        return _transport.PostAsync<GoogleAuthResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<TokenResponseDto>> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.RefreshTokenPathTemplate);
        return _transport.PostAsync<TokenResponseDto>(
            path,
            new RefreshTokenRequestDto { RefreshToken = refreshToken },
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<NoContentDto>> LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.LogoutPathTemplate);
        return _transport.PostNoContentAsync(
            path,
            new LogoutRequestDto { RefreshToken = refreshToken },
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendVerifyEmailOtpWhenNotLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendVerifyEmailOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendChangeUsernameOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendChangeUsernameOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendChangePhoneNumberOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendChangePhoneNumberOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyChangeUsernameOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyChangeUsernameOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyChangePhoneNumberOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyChangePhoneNumberOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendResetPasswordOtpWhenNotLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SendResetPasswordOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, payload: null, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyEmailOtpWhenNotLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyEmailOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyResetPasswordOtpWhenNotLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(
            path,
            request,
            cancellationToken,
            allowAmbientAccessToken: false);
    }

    public Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.VerifyResetPasswordOtpWhenLoginPathTemplate);
        return _transport.PostAsync<OtpVerifyResponseDto>(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<MessageResponseDto>> ResetPasswordAsync(
        string resetToken,
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ResetPasswordPathTemplate);
        var additionalHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["X-Reset-Token"] = resetToken
        };

        return _transport.PostAsync<MessageResponseDto>(
            path,
            request,
            cancellationToken,
            additionalHeaders: additionalHeaders,
            allowAmbientAccessToken: false);
    }
}
