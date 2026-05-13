namespace InteractHub.Api.Common.Utilities;

public static class ReadModelHelper
{
    public static DateTime NormalizeObservedAtUtc(DateTime? observedAtUtc)
    {
        if (!observedAtUtc.HasValue)
        {
            return DateTime.UtcNow;
        }

        return observedAtUtc.Value.Kind == DateTimeKind.Utc
            ? observedAtUtc.Value
            : observedAtUtc.Value.ToUniversalTime();
    }
}
