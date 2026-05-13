using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.CommentReports;

public class CreateCommentReportRequestDto
{
    [Required]
    public Guid CommentId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}



