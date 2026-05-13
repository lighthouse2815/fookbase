using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface ICommentReactionRepository
{
    Task<CommentReaction?> GetByCommentAndUserAsync(Guid commentId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CommentReaction>> GetByCommentIdAsync(
        Guid commentId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CommentReaction>> GetByCommentIdsAsync(
        IReadOnlyCollection<Guid> commentIds,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CommentReaction>> GetByCommentIdsAndUserAsync(
        IReadOnlyCollection<Guid> commentIds,
        Guid userId,
        CancellationToken cancellationToken);

    Task AddAsync(CommentReaction reaction, CancellationToken cancellationToken);

    void Remove(CommentReaction reaction);
}



