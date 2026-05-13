namespace InteractHub.Api.Common.Extensions;

public static class StringExtensions
{
    public static string? TrimToNull(this string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    public static string? NormalizeUsernameOrNull(this string? value)
    {
        var trimmed = value.TrimToNull();
        if (trimmed is null)
        {
            return null;
        }

        var atIndex = trimmed.IndexOf('@');
        if (atIndex > 0)
        {
            var fromEmail = trimmed[..atIndex].TrimToNull();
            if (fromEmail is not null)
            {
                return fromEmail;
            }
        }

        return trimmed;
    }
}



