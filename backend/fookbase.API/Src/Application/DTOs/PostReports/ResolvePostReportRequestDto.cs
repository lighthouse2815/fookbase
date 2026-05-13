using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.PostReports;

public class ResolvePostReportRequestDto
{
    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string Status { get; set; } = "RESOLVED";
}


