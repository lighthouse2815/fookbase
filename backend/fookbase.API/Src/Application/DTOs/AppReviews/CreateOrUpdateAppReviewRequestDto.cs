using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.AppReviews;

public class CreateOrUpdateAppReviewRequestDto
{
    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [StringLength(1000, MinimumLength = 3)]
    public string Comment { get; set; } = string.Empty;
}



