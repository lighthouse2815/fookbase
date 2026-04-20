using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Application.Services;

public class AdminConsoleService : IAdminConsoleService
{
    private static readonly HashSet<string> AllowedUserStatuses =
    [
        "ACTIVE",
        "BANNED",
        "INACTIVE"
    ];

    private readonly IJavaApiService _javaApiService;
    private readonly IPostRepository _postRepository;
    private readonly IPostReportRepository _postReportRepository;
    private readonly ICommentReportRepository _commentReportRepository;
    private readonly IUserReportRepository _userReportRepository;
    private readonly IStoryReportRepository _storyReportRepository;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly ILogger<AdminConsoleService> _logger;

    public AdminConsoleService(
        IJavaApiService javaApiService,
        IPostRepository postRepository,
        IPostReportRepository postReportRepository,
        ICommentReportRepository commentReportRepository,
        IUserReportRepository userReportRepository,
        IStoryReportRepository storyReportRepository,
        IAdminAuditLogService adminAuditLogService,
        ILogger<AdminConsoleService> logger)
    {
        _javaApiService = javaApiService;
        _postRepository = postRepository;
        _postReportRepository = postReportRepository;
        _commentReportRepository = commentReportRepository;
        _userReportRepository = userReportRepository;
        _storyReportRepository = storyReportRepository;
        _adminAuditLogService = adminAuditLogService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AdminUserSearchResponseDto>> SearchUsersAsync(
        string? keyword,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        var result = await _javaApiService.SearchAdminUsersAsync(keyword, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            throw BuildJavaError(result, "Search admin users failed.");
        }

        return result.Data.Select(static item => item.ToResponseDto()).ToList();
    }

    public async Task<AdminUserSearchResponseDto> UpdateUserStatusAsync(
        Guid adminUserId,
        Guid targetUserId,
        UpdateAdminUserStatusRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        var normalizedStatus = request.Status.Trim().ToUpperInvariant();
        if (!AllowedUserStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be ACTIVE, BANNED or INACTIVE.");
        }

        var result = await _javaApiService.UpdateAdminUserStatusAsync(
            targetUserId,
            normalizedStatus,
            accessToken.Trim(),
            cancellationToken);

        if (!result.IsSuccess || result.Data is null)
        {
            throw BuildJavaError(result, "Update user status failed.");
        }

        var actualStatus = string.IsNullOrWhiteSpace(result.Data.Status)
            ? normalizedStatus
            : result.Data.Status.Trim().ToUpperInvariant();

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                "USER_STATUS_UPDATED",
                "USER",
                targetUserId,
                targetUserId,
                $"Status updated to {actualStatus}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist admin audit log for user status update. UserId={UserId}", targetUserId);
        }

        return result.Data.ToResponseDto();
    }

    public async Task<AdminDashboardResponseDto> GetDashboardAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        var userStatsResult = await _javaApiService.GetAdminUserStatsAsync(accessToken.Trim(), cancellationToken);
        if (!userStatsResult.IsSuccess || userStatsResult.Data is null)
        {
            throw BuildJavaError(userStatsResult, "Load admin dashboard user stats failed.");
        }

        var userStats = userStatsResult.Data;
        var totalPosts = await _postRepository.CountAsync(cancellationToken);

        var pendingPostReports = await _postReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingCommentReports = await _commentReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingUserReports = await _userReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingStoryReports = await _storyReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);

        var months = userStats.MonthlyCreatedUsers
            .Select(month => month.Month?.Trim())
            .Where(static month => !string.IsNullOrWhiteSpace(month))
            .Select(static month => month!)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static month => month, StringComparer.Ordinal)
            .ToList();

        if (months.Count == 0)
        {
            var now = DateTime.UtcNow;
            for (var index = 5; index >= 0; index--)
            {
                var month = new DateTime(now.Year, now.Month, 1).AddMonths(-index).ToString("yyyy-MM");
                months.Add(month);
            }
        }

        var firstMonthUtc = DateTime.ParseExact($"{months[0]}-01", "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.AssumeUniversal);
        var postCreatedDates = await _postRepository.GetCreatedDatesSinceAsync(firstMonthUtc, cancellationToken);
        var postsByMonth = postCreatedDates
            .GroupBy(createdAt => createdAt.ToString("yyyy-MM"))
            .ToDictionary(group => group.Key, group => (long)group.Count(), StringComparer.Ordinal);

        var usersByMonth = userStats.MonthlyCreatedUsers
            .Where(month => !string.IsNullOrWhiteSpace(month.Month))
            .GroupBy(month => month.Month!.Trim(), StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Last().Count, StringComparer.Ordinal);

        var monthlyMetrics = months
            .Select(month => new AdminMonthlyMetricDto
            {
                Month = month,
                Users = usersByMonth.TryGetValue(month, out var monthlyUsers) ? monthlyUsers : 0,
                Posts = postsByMonth.TryGetValue(month, out var monthlyPosts) ? monthlyPosts : 0
            })
            .ToList();

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

    private static Exception BuildJavaError<T>(JavaApiCallResult<T> result, string fallbackMessage)
    {
        var errorMessage = string.IsNullOrWhiteSpace(result.ErrorMessage)
            ? fallbackMessage
            : result.ErrorMessage;

        return result.StatusCode switch
        {
            StatusCodes.Status404NotFound => new NotFoundException(errorMessage),
            StatusCodes.Status403Forbidden => new ForbiddenException(errorMessage),
            StatusCodes.Status401Unauthorized => new UnauthorizedAccessException(errorMessage),
            StatusCodes.Status400BadRequest => new ArgumentException(errorMessage),
            _ => new ServiceUnavailableException(errorMessage)
        };
    }
}
