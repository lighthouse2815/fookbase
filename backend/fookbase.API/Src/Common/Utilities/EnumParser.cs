using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Common.Utilities;

public static class EnumParser
{
    public static bool TryParseReactionType(string? value, out ReactionType reactionType)
    {
        reactionType = default;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();
        return Enum.TryParse(normalized, ignoreCase: true, out reactionType)
            && Enum.IsDefined(reactionType);
    }

    public static bool TryParseReportStatus(string? value, out ReportStatus reportStatus)
    {
        reportStatus = default;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim();
        return Enum.TryParse(normalized, ignoreCase: true, out reportStatus)
            && Enum.IsDefined(reportStatus);
    }
}
