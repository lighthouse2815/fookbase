using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.SavedPosts;

public class SavePostRequestDto
{
    [Required]
    public Guid PostId { get; set; }
}
