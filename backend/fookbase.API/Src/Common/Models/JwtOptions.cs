namespace InteractHub.Api.Common.Models;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "InteractHub";

    public string Audience { get; init; } = "InteractHub.Client";

    public bool ValidateIssuer { get; init; } = false;

    public bool ValidateAudience { get; init; } = false;

    public string SecretKey { get; init; } = "dang_dep_trai_sieu_cap_vip_pro_2k5_2026!!!";

    public int ExpirationMinutes { get; init; } = 60;
}
