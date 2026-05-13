using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Mappers;

public static class AdminConsoleMapper
{
    public static AdminUserSearchResponseDto ToResponseDto(this AdminUserSearchDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new AdminUserSearchResponseDto
        {
            UserId = dto.UserId,
            Username = dto.Username?.Trim() ?? string.Empty,
            DisplayName = dto.DisplayName?.Trim() ?? dto.Username?.Trim() ?? "user",
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl)
                ? AvatarUrlHelper.BuildDefaultAvatarUrl(dto.UserId)
                : dto.AvatarUrl.Trim(),
            Email = dto.Email?.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            Role = dto.Role?.Trim() ?? "USER",
            Status = string.IsNullOrWhiteSpace(dto.Status)
                ? "UNKNOWN"
                : dto.Status.Trim().ToUpperInvariant(),
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt
        };
    }

    public static IReadOnlyList<string> ResolveDashboardMonths(
        this AdminUserStatsDto userStats,
        DateTime nowUtc,
        int fallbackMonthCount = 6)
    {
        ArgumentNullException.ThrowIfNull(userStats);

        var months = userStats.MonthlyCreatedUsers
            .Select(month => month.Month?.Trim())
            .Where(static month => !string.IsNullOrWhiteSpace(month))
            .Select(static month => month!)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static month => month, StringComparer.Ordinal)
            .ToList();

        if (months.Count > 0)
        {
            return months;
        }

        var normalizedNow = new DateTime(nowUtc.Year, nowUtc.Month, 1);
        for (var index = fallbackMonthCount - 1; index >= 0; index--)
        {
            months.Add(normalizedNow.AddMonths(-index).ToString("yyyy-MM"));
        }

        return months;
    }

    public static IReadOnlyList<AdminMonthlyMetricDto> ToMonthlyMetrics(
        this AdminUserStatsDto userStats,
        IReadOnlyList<string> months,
        IReadOnlyDictionary<string, long> postsByMonth)
    {
        ArgumentNullException.ThrowIfNull(userStats);
        ArgumentNullException.ThrowIfNull(months);
        ArgumentNullException.ThrowIfNull(postsByMonth);

        var usersByMonth = userStats.MonthlyCreatedUsers
            .Where(month => !string.IsNullOrWhiteSpace(month.Month))
            .GroupBy(month => month.Month!.Trim(), StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Last().Count, StringComparer.Ordinal);

        return months
            .Select(month => new AdminMonthlyMetricDto
            {
                Month = month,
                Users = usersByMonth.TryGetValue(month, out var monthlyUsers) ? monthlyUsers : 0,
                Posts = postsByMonth.TryGetValue(month, out var monthlyPosts) ? monthlyPosts : 0
            })
            .ToList();
    }

    public static AdminDashboardResponseDto ToDashboardResponseDto(
        this AdminUserStatsDto userStats,
        long totalPosts,
        int pendingPostReports,
        int pendingCommentReports,
        int pendingUserReports,
        int pendingStoryReports,
        IReadOnlyList<AdminMonthlyMetricDto> monthlyMetrics)
    {
        ArgumentNullException.ThrowIfNull(userStats);
        ArgumentNullException.ThrowIfNull(monthlyMetrics);

        return new AdminDashboardResponseDto
        {
            TotalUsers = userStats.TotalUsers,
            ActiveUsers = userStats.ActiveUsers,
            BannedUsers = userStats.BannedUsers,
            InactiveUsers = userStats.InactiveUsers,
            TotalPosts = totalPosts,
            PendingPostReports = pendingPostReports,
            PendingCommentReports = pendingCommentReports,
            PendingUserReports = pendingUserReports,
            PendingStoryReports = pendingStoryReports,
            MonthlyMetrics = monthlyMetrics
        };
    }
}



