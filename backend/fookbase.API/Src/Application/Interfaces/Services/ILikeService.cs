using InteractHub.Api.Application.DTOs.Likes;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ILikeService
{
    Task<LikeStateResponseDto> LikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken);

    Task<LikeStateResponseDto> UnlikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken);
}