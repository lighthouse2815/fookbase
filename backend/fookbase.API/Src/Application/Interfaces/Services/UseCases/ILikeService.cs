using InteractHub.Api.Application.DTOs.Likes;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ILikeService
{
    Task<PostReactionUsersResponseDto> GetReactionUsersAsync(Guid postId, CancellationToken cancellationToken);

    Task<PostReactionStateResponseDto> SetReactionAsync(
        Guid postId,
        Guid userId,
        SetPostReactionRequestDto request,
        CancellationToken cancellationToken);

    Task<PostReactionStateResponseDto> RemoveReactionAsync(
        Guid postId,
        Guid userId,
        CancellationToken cancellationToken);
}



