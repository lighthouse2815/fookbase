namespace InteractHub.Api.Common.Utilities;

public static class PostMediaSerializer
{
    private const int MaxMediaPerPost = 10;

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
