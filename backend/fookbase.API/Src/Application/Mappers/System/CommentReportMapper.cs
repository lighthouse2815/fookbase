using InteractHub.Api.Application.DTOs.CommentReports;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class CommentReportMapper
{
    public static CommentReportResponseDto ToResponseDto(
        this CommentReport report,
        Guid? commentOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? commentOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new CommentReportResponseDto
        {
            Id = report.Id,
            CommentId = report.CommentId,
            PostId = report.PostId,
            ReportedByUserId = report.ReportedByUserId,
            CommentOwnerUserId = commentOwnerUserId,
            Reason = report.Reason,
            Status = report.Status,
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            CommentOwner = commentOwner
        };
    }

    public static List<CommentReportResponseDto> ToResponseDtos(
        IReadOnlyList<CommentReport> reports,
        IReadOnlyDictionary<Guid, Guid> commentOwnerLookup,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(reports);
        ArgumentNullException.ThrowIfNull(commentOwnerLookup);
        ArgumentNullException.ThrowIfNull(profileLookup);

        return reports
            .Select(report =>
            {
                var commentOwnerUserId = commentOwnerLookup.TryGetValue(report.CommentId, out var ownerId)
                    ? ownerId
                    : (Guid?)null;

                return report.ToResponseDto(
                    commentOwnerUserId: commentOwnerUserId,
                    reporter: ResolveAuthorSummary(report.ReportedByUserId, profileLookup, fallbackDisplayName),
                    commentOwner: commentOwnerUserId.HasValue
                        ? ResolveAuthorSummary(commentOwnerUserId.Value, profileLookup, fallbackDisplayName)
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
