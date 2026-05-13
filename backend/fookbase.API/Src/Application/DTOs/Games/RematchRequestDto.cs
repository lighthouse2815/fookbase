using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Games;

public sealed class RematchRequestDto
{
    [Required]
    public Guid RoomId { get; init; }
}



