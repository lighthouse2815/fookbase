using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminHashtagOverviewResponseDto
{
    public string CurrentMonth { get; init; } = string.Empty;

    public IReadOnlyList<AdminHashtagUsageResponseDto> TopHashtags { get; init; } = [];

    public PagedResult<AdminHashtagUsageResponseDto> Hashtags { get; init; }
        = PagedResult<AdminHashtagUsageResponseDto>.Create([], 1, 1, 0);
}
