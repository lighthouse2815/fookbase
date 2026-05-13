using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class PostMedia
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Post? Post { get; set; }

    public string MediaUrl { get; set; } = string.Empty;

    public MediaType MediaType { get; set; } = MediaType.IMAGE;

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}



