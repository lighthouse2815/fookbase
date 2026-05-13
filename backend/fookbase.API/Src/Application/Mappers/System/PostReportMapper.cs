using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class PostReportMapper
{
    public static PostReportResponseDto ToResponseDto(
        this PostReport report,
        Guid? postOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? postOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new PostReportResponseDto
        {
            Id = report.Id,
            PostId = report.PostId,
            ReportedByUserId = report.ReportedByUserId,
            PostOwnerUserId = postOwnerUserId,
            Reason = report.Reason,
            Status = report.Status,
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            PostOwner = postOwner
        };
    }

    public static List<PostReportResponseDto> ToResponseDtos(
        IReadOnlyList<PostReport> reports,
        IReadOnlyDictionary<Guid, Guid> postOwnerLookup,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(reports);
        ArgumentNullException.ThrowIfNull(postOwnerLookup);
        ArgumentNullException.ThrowIfNull(profileLookup);

        return reports
            .Select(report =>
            {
                var postOwnerUserId = postOwnerLookup.TryGetValue(report.PostId, out var ownerId)
                    ? ownerId
                    : (Guid?)null;

                return report.ToResponseDto(
                    postOwnerUserId: postOwnerUserId,
                    reporter: ResolveAuthorSummary(report.ReportedByUserId, profileLookup, fallbackDisplayName),
                    postOwner: postOwnerUserId.HasValue
                        ? ResolveAuthorSummary(postOwnerUserId.Value, profileLookup, fallbackDisplayName)
                        : null);
            })
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
