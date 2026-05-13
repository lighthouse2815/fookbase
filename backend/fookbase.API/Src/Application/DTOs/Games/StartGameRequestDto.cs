using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games;

public sealed class StartGameRequestDto
{
    [Required]
    public Guid RoomId { get; init; }
}




