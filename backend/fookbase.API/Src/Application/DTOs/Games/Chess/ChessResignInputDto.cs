using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games.Chess;

public sealed class ChessResignInputDto
{
    [Required]
    public Guid RoomId { get; init; }
}




