using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.StoryReports;

public class CreateStoryReportRequestDto
{
    [Required]
    public Guid StoryId { get; init; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Reason { get; init; } = string.Empty;
}

