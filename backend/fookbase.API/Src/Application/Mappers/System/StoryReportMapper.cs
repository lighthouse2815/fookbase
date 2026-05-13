using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.StoryReports;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class StoryReportMapper
{
    public static StoryReportResponseDto ToResponseDto(
        this StoryReport report,
        Guid? storyOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? storyOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new StoryReportResponseDto
        {
            Id = report.Id,
            StoryId = report.StoryId,
            StoryOwnerUserId = storyOwnerUserId,
            ReportedByUserId = report.ReportedByUserId,
            Reason = report.Reason,
            Status = report.Status,
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            StoryOwner = storyOwner
        };
    }

    public static List<StoryReportResponseDto> ToResponseDtos(
        IReadOnlyList<StoryReport> reports,
        IReadOnlyDictionary<Guid, Guid> storyOwnerLookup,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(reports);
        ArgumentNullException.ThrowIfNull(storyOwnerLookup);
        ArgumentNullException.ThrowIfNull(profileLookup);

        return reports
            .Select(report =>
            {
                var storyOwnerUserId = storyOwnerLookup.TryGetValue(report.StoryId, out var ownerId)
                    ? ownerId
                    : (Guid?)null;

                return report.ToResponseDto(
                    storyOwnerUserId: storyOwnerUserId,
                    reporter: ResolveAuthorSummary(report.ReportedByUserId, profileLookup, fallbackDisplayName),
                    storyOwner: storyOwnerUserId.HasValue
                        ? ResolveAuthorSummary(storyOwnerUserId.Value, profileLookup, fallbackDisplayName)
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
