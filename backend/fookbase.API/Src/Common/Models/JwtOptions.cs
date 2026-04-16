namespace InteractHub.Api.Common.Models;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "InteractHub";

    public string Audience { get; init; } = "InteractHub.Client";

    public bool ValidateIssuer { get; init; } = false;

    public bool ValidateAudience { get; init; } = false;

    public bool ValidateIssuerSigningKey { get; init; } = true;

    public string SecretKey { get; init; } = "CHANGE_ME_USE_ENV_FOR_JWT_SECRET_KEY";

    public int ExpirationMinutes { get; init; } = 60;
}
