using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games;

public sealed class CreateRoomRequestDto
{
    [Required]
    [MaxLength(32)]
    public required string GameType { get; init; }

    [Range(2, 4)]
    public int? MaxPlayers { get; init; }

    [MaxLength(80)]
    public string? DisplayName { get; init; }

    [MaxLength(512)]
    public string? AvatarUrl { get; init; }
}




