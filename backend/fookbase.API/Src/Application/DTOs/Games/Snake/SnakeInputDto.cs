using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games.Snake;

public sealed class SnakeInputDto
{
    [Required]
    public Guid RoomId { get; init; }

    [Required]
    [RegularExpression("^(up|down|left|right)$", ErrorMessage = "direction must be up, down, left, right.")]
    public required string Direction { get; init; }
}




