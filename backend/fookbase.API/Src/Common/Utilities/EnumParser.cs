using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Common.Utilities;

public static class EnumParser
{
    public static bool TryParseUserStatus(string? value, out UserStatus userStatus)
    {
        return TryParseDefinedEnum(value, out userStatus);
    }

    public static bool TryParseReactionType(string? value, out ReactionType reactionType)
    {
        return TryParseDefinedEnum(value, out reactionType);
    }

    public static bool TryParseReportStatus(string? value, out ReportStatus reportStatus)
    {
        return TryParseDefinedEnum(value, out reportStatus);
    }

    public static bool TryParseNotificationType(string? value, out NotificationType notificationType)
    {
        return TryParseDefinedEnum(value, out notificationType);
    }

    public static bool TryParseMediaType(string? value, out MediaType mediaType)
    {
        return TryParseDefinedEnum(value, out mediaType);
    }

    private static bool TryParseDefinedEnum<TEnum>(string? value, out TEnum result)
        where TEnum : struct, Enum
    {
        result = default;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();
        return Enum.TryParse(normalized, ignoreCase: true, out result)
            && Enum.IsDefined(result);
    }
}
