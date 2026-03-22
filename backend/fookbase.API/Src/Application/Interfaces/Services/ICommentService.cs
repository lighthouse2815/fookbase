using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICommentService
{
    Task<PagedResult<CommentResponseDto>> GetByPostIdAsync(Guid postId, PaginationQuery query, CancellationToken cancellationToken);

    Task<CommentResponseDto> GetByIdAsync(Guid commentId, CancellationToken cancellationToken);

    Task<CommentResponseDto> CreateAsync(Guid userId, CreateCommentRequestDto request, CancellationToken cancellationToken);

    Task<CommentResponseDto> UpdateAsync(Guid commentId, Guid userId, bool isAdmin, UpdateCommentRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid commentId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}