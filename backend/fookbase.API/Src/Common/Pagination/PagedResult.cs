namespace InteractHub.Api.Common.Pagination;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();

    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalCount { get; init; }

    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Math.Max(PageSize, 1));

    public static PagedResult<T> Create(IEnumerable<T> items, int page, int pageSize, int totalCount)
    {
        return new PagedResult<T>
        {
            Items = items.ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}