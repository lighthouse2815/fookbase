namespace InteractHub.Api.Application.DTOs.Comments;

public record CommentReactionUsersResponseDto
{
    public Guid CommentId { get; init; }

    public int TotalCount { get; init; }

    public IReadOnlyList<CommentReactionUserDto> Users { get; init; } = Array.Empty<CommentReactionUserDto>();
}
