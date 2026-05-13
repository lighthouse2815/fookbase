using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Comments;

public record CommentResponseDto
{
    public Guid Id { get; init; }

    public Guid PostId { get; init; }

    public Guid? ParentCommentId { get; init; }

    public Guid UserId { get; init; }

    public AuthorSummaryDto Author { get; init; } = new();

    public string Content { get; init; } = string.Empty;

    public IReadOnlyList<string> MediaUrls { get; init; } = Array.Empty<string>();

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public ReactionType? CurrentUserReactionType { get; init; }

    public int ReactionCount { get; init; }

    public IReadOnlyList<ReactionType> TopReactionTypes { get; init; } = Array.Empty<ReactionType>();

    public int ReplyCount { get; init; }

    public IReadOnlyList<CommentResponseDto> Replies { get; init; } = Array.Empty<CommentResponseDto>();
}



