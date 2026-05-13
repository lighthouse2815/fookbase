using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class UserReportMapper
{
    public static UserReportResponseDto ToResponseDto(
        this UserReport report,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? targetUser = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new UserReportResponseDto
        {
            Id = report.Id,
            TargetUserId = report.TargetUserId,
            ReportedByUserId = report.ReportedByUserId,
            Reason = report.Reason,
            Status = report.Status,
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            TargetUser = targetUser
        };
    }

    public static List<UserReportResponseDto> ToResponseDtos(
        IReadOnlyList<UserReport> reports,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(reports);
        ArgumentNullException.ThrowIfNull(profileLookup);

        return reports
            .Select(report => report.ToResponseDto(
                reporter: ResolveAuthorSummary(report.ReportedByUserId, profileLookup, fallbackDisplayName),
                targetUser: ResolveAuthorSummary(report.TargetUserId, profileLookup, fallbackDisplayName)))
            .ToList();
    }

    private static AuthorSummaryDto ResolveAuthorSummary(
        Guid userId,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName)
    {
        var profile = profileLookup.TryGetValue(userId, out var value) ? value : null;
        return UserProfileSummaryMapper.ToAuthorSummary(userId, profile, fallbackDisplayName);
    }
}
