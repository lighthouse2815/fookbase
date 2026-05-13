namespace InteractHub.Api.Application.DTOs.Likes;

public record PostReactionUsersResponseDto
{
    public Guid PostId { get; init; }

    public int TotalCount { get; init; }

    public IReadOnlyList<PostReactionUserDto> Users { get; init; } = Array.Empty<PostReactionUserDto>();
}



