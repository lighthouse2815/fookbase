using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Likes;

public record PostReactionUserDto
{
    public Guid UserId { get; init; }

    public string DisplayName { get; init; } = "user";

    public string AvatarUrl { get; init; } = string.Empty;

    public ReactionType ReactionType { get; init; }

    public DateTime ReactedAt { get; init; }
}



