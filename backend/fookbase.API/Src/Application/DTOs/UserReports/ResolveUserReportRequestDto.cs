using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.UserReports;

public class ResolveUserReportRequestDto
{
    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string Status { get; set; } = "RESOLVED";
}



