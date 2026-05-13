using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games.Caro;

public sealed class CaroMoveInputDto
{
    [Required]
    public Guid RoomId { get; init; }

    [Range(0, 99)]
    public int Row { get; init; }

    [Range(0, 99)]
    public int Col { get; init; }
}




