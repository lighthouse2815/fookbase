using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.StoryReports;

public class ResolveStoryReportRequestDto
{
    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string Status { get; init; } = string.Empty;
}

