using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games;

public sealed class JoinRoomRequestDto
{
    [Required]
    public Guid RoomId { get; init; }

    [MaxLength(80)]
    public string? DisplayName { get; init; }

    [MaxLength(512)]
    public string? AvatarUrl { get; init; }
}




