using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.PostReports;

public class CreatePostReportRequestDto
{
    [Required]
    public Guid PostId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}