using System.Text.Json;

namespace InteractHub.Api.Common.Utilities;

public static class PostMediaSerializer
{
    private const int MaxMediaPerPost = 10;

    public static IReadOnlyList<string> Deserialize(string? storedValue)
    {
        if (string.IsNullOrWhiteSpace(storedValue))
        {
            return Array.Empty<string>();
        }

        var trimmed = storedValue.Trim();
        if (trimmed.StartsWith('['))
        {
            try
            {
                var urls = JsonSerializer.Deserialize<List<string>>(trimmed);
                return Normalize(urls);
            }
            catch
            {
                return Normalize([trimmed]);
            }
        }

        return Normalize([trimmed]);
    }

    public static string? Serialize(IReadOnlyList<string> mediaUrls)
    {
        var normalized = Normalize(mediaUrls);
        if (normalized.Count == 0)
        {
            return null;
        }

        if (normalized.Count == 1)
        {
            return normalized[0];
        }

        return JsonSerializer.Serialize(normalized);
    }

    public static IReadOnlyList<string> Normalize(IEnumerable<string?>? values)
    {
        if (values is null)
        {
            return Array.Empty<string>();
        }

        return values
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value!.Trim())
            .Distinct(StringComparer.Ordinal)
            .Take(MaxMediaPerPost)
            .ToList();
    }
}
