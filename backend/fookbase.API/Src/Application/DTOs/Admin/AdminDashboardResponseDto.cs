namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminDashboardResponseDto
{
    public long TotalUsers { get; init; }

    public long ActiveUsers { get; init; }

    public long BannedUsers { get; init; }

    public long InactiveUsers { get; init; }

    public long TotalPosts { get; init; }

    public int PendingPostReports { get; init; }

    public int PendingCommentReports { get; init; }

    public int PendingUserReports { get; init; }

    public int PendingStoryReports { get; init; }

    public IReadOnlyList<AdminMonthlyMetricDto> MonthlyMetrics { get; init; } = Array.Empty<AdminMonthlyMetricDto>();
}

public class AdminMonthlyMetricDto
{
    public string Month { get; init; } = string.Empty;

    public long Users { get; init; }

    public long Posts { get; init; }
}
