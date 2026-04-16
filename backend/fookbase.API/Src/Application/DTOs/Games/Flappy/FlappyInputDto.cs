using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games.Flappy;

public sealed class FlappyInputDto
{
    [Required]
    public Guid RoomId { get; init; }

    [Required]
    [RegularExpression("^flap$", ErrorMessage = "Only flap action is supported.")]
    public required string Action { get; init; }
}

