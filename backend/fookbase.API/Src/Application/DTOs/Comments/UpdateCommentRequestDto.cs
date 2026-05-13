using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Comments;

public class UpdateCommentRequestDto
{
    [StringLength(1000)]
    public string? Content { get; set; }

    public IReadOnlyList<string>? MediaUrls { get; set; }
}



