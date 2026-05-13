namespace InteractHub.Api.Application.DTOs.Common;

public class AuthorSummaryDto
{
    public Guid Id { get; init; }

    public string DisplayName { get; init; } = "user";

    public string? AvatarUrl { get; init; }
}



