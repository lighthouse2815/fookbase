namespace InteractHub.Api.Common.Pagination;

public class PaginationQuery
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 50;

    public int Page { get; set; } = DefaultPage;

    public int PageSize { get; set; } = DefaultPageSize;

    public void Normalize()
    {
        if (Page < 1)
        {
            Page = DefaultPage;
        }

        if (PageSize < 1)
        {
            PageSize = DefaultPageSize;
        }

        if (PageSize > MaxPageSize)
        {
            PageSize = MaxPageSize;
        }
    }
}