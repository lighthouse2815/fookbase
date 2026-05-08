using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Comments;

public class CreateCommentRequestDto
{
    [Required]
    public Guid PostId { get; set; }

    public Guid? ParentCommentId { get; set; }

    [StringLength(1000)]
    public string? Content { get; set; }

    public IReadOnlyList<string>? MediaUrls { get; set; }
}
