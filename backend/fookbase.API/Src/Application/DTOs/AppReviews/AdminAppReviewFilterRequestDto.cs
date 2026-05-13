using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.AppReviews;

public class AdminAppReviewFilterRequestDto
{
    [Range(1, 5)]
    public int? Rating { get; set; }

    public bool? IsHidden { get; set; }
}



