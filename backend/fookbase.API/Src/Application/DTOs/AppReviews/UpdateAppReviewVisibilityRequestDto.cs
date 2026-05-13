using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.AppReviews;

public class UpdateAppReviewVisibilityRequestDto
{
    [Required]
    public bool? IsHidden { get; set; }
}



