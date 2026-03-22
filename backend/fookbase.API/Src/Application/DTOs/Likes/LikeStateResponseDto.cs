namespace InteractHub.Api.Application.DTOs.Likes;

public class LikeStateResponseDto
{
    public Guid PostId { get; init; }

    public bool Liked { get; init; }

    public int LikeCount { get; init; }
}