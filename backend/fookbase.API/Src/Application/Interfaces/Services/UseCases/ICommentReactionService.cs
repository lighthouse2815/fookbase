using InteractHub.Api.Application.DTOs.Comments;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICommentReactionService
{
    Task<CommentReactionUsersResponseDto> GetReactionUsersAsync(
        Guid commentId,
        CancellationToken cancellationToken);

    Task<CommentReactionStateResponseDto> SetReactionAsync(
        Guid commentId,
        Guid userId,
        SetCommentReactionRequestDto request,
        CancellationToken cancellationToken);

    Task<CommentReactionStateResponseDto> RemoveReactionAsync(
        Guid commentId,
        Guid userId,
        CancellationToken cancellationToken);
}
