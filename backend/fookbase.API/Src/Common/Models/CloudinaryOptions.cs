namespace InteractHub.Api.Common.Models;

public class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;

    public string ApiSecret { get; set; } = string.Empty;

    public string UploadPreset { get; set; } = string.Empty;

    public string UploadFolder { get; set; } = "fookbase/posts";
}



