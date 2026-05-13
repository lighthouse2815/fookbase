using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Services;

public class AdminConsoleService : IAdminConsoleService
{
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IJavaAdminApiService _javaAdminApiService;
    private readonly IPostRepository _postRepository;
    private readonly IPostReportRepository _postReportRepository;
    private readonly ICommentReportRepository _commentReportRepository;
    private readonly IUserReportRepository _userReportRepository;
    private readonly IStoryReportRepository _storyReportRepository;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly ILogger<AdminConsoleService> _logger;

    public AdminConsoleService(
        IAccessTokenProvider accessTokenProvider,
        IJavaAdminApiService javaAdminApiService,
        IPostRepository postRepository,
        IPostReportRepository postReportRepository,
        ICommentReportRepository commentReportRepository,
        IUserReportRepository userReportRepository,
        IStoryReportRepository storyReportRepository,
        IAdminAuditLogService adminAuditLogService,
        ILogger<AdminConsoleService> logger)
    {
        _accessTokenProvider = accessTokenProvider;
        _javaAdminApiService = javaAdminApiService;
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
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var result = await _javaAdminApiService.SearchAdminUsersAsync(keyword, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            throw new BusinessException(ErrorCode.SERVICE_ADMIN_JAVA_FAILED, result.ErrorMessage);
        }

        return result.Data.Select(static item => item.ToResponseDto()).ToList();
    }

    public async Task<AdminUserSearchResponseDto> UpdateUserStatusAsync(
        Guid adminUserId,
        Guid targetUserId,
        UpdateAdminUserStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        if (!EnumParser.TryParseUserStatus(request.Status, out var normalizedStatus))
        {
            throw new BusinessException(ErrorCode.INVALID_USER_STATUS);
        }

        var result = await _javaAdminApiService.UpdateAdminUserStatusAsync(
            targetUserId,
            normalizedStatus,
            accessToken,
            cancellationToken);

        if (!result.IsSuccess || result.Data is null)
        {
            throw new BusinessException(ErrorCode.SERVICE_ADMIN_JAVA_FAILED, result.ErrorMessage);
        }

        var statusForAudit = result.Data.Status!.Trim().ToUpperInvariant();

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            AdminAuditActionType.USER_STATUS_UPDATED,
            AdminAuditEntityType.USER,
            targetUserId,
            targetUserId,
            $"Status updated to {statusForAudit}.",
            cancellationToken);

        return result.Data.ToResponseDto();
    }

    public async Task<AdminDashboardResponseDto> GetDashboardAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var userStatsResult = await _javaAdminApiService.GetAdminUserStatsAsync(accessToken, cancellationToken);
        if (!userStatsResult.IsSuccess || userStatsResult.Data is null)
        {
            throw new BusinessException(ErrorCode.SERVICE_ADMIN_JAVA_FAILED, userStatsResult.ErrorMessage);
        }

        var userStats = userStatsResult.Data;
        var totalPosts = await _postRepository.CountAsync(cancellationToken);

        var pendingPostReports = await _postReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingCommentReports = await _commentReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingUserReports = await _userReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
        var pendingStoryReports = await _storyReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);

        var months = userStats.ResolveDashboardMonths(DateTime.UtcNow);

        var firstMonthUtc = DateTime.ParseExact($"{months[0]}-01", "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.AssumeUniversal);
        var postCreatedDates = await _postRepository.GetCreatedDatesSinceAsync(firstMonthUtc, cancellationToken);
        var postsByMonth = postCreatedDates
            .GroupBy(createdAt => createdAt.ToString("yyyy-MM"))
            .ToDictionary(group => group.Key, group => (long)group.Count(), StringComparer.Ordinal);

        var monthlyMetrics = userStats.ToMonthlyMetrics(months, postsByMonth);

        return userStats.ToDashboardResponseDto(
            totalPosts,
            pendingPostReports,
            pendingCommentReports,
            pendingUserReports,
            pendingStoryReports,
            monthlyMetrics);
    }

}



