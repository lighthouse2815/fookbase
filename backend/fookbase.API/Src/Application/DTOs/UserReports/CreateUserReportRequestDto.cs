using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.UserReports;

public class CreateUserReportRequestDto
{
    [Required]
    public Guid TargetUserId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}



