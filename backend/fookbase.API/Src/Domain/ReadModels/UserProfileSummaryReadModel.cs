namespace InteractHub.Api.Domain.Entities;

public class UserProfileSummaryReadModel
{
    public Guid UserId { get; set; }

    public string DisplayName { get; set; } = "user";

    public string AvatarUrl { get; set; } =  "https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg";

    public DateTime UpdatedAtUtc { get; set; }
}



