using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games;

public sealed class LeaveRoomRequestDto
{
    [Required]
    public Guid RoomId { get; init; }
}




