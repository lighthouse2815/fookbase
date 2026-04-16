using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games.Chess;

public sealed class ChessMoveInputDto
{
    [Required]
    public Guid RoomId { get; init; }

    [Required]
    [RegularExpression("^[a-h][1-8]$", ErrorMessage = "from must be a valid square.")]
    public required string From { get; init; }

    [Required]
    [RegularExpression("^[a-h][1-8]$", ErrorMessage = "to must be a valid square.")]
    public required string To { get; init; }

    [RegularExpression("^(q|r|b|n|Q|R|B|N)?$", ErrorMessage = "promotion must be q, r, b, n.")]
    public string? Promotion { get; init; }
}

