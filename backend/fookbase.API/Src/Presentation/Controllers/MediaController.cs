using InteractHub.Api.Application.DTOs.Media;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ApiControllerBase
{
    private readonly ICloudinarySigningService _cloudinarySigningService;

    public MediaController(ICloudinarySigningService cloudinarySigningService)
    {
        _cloudinarySigningService = cloudinarySigningService;
    }

    [HttpGet("cloudinary-signature")]
    [Authorize]
    [EnableRateLimiting("CloudinarySignaturePolicy")]
    public ActionResult<ApiResponse<CloudinaryUploadSignatureResponseDto>> GetCloudinaryUploadSignature()
    {
        if (!_cloudinarySigningService.IsConfigured())
        {
            return ErrorResponse<CloudinaryUploadSignatureResponseDto>(
                ErrorCode.CLOUDINARY_SIGNING_NOT_CONFIGURED,
                StatusCodes.Status503ServiceUnavailable,
                "Cloudinary signing is not configured.");
        }

        var userId = GetCurrentUserId();
        var uploadFolder = _cloudinarySigningService.BuildMediaUploadFolder(userId);
        var publicId = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}";
        const bool overwrite = false;
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var parametersToSign = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = uploadFolder,
            ["overwrite"] = overwrite.ToString().ToLowerInvariant(),
            ["public_id"] = publicId,
            ["timestamp"] = timestamp.ToString(),
            ["upload_preset"] = _cloudinarySigningService.UploadPreset
        };

        var signature = _cloudinarySigningService.GenerateSignature(parametersToSign);

        var response = new CloudinaryUploadSignatureResponseDto
        {
            CloudName = _cloudinarySigningService.CloudName,
            ApiKey = _cloudinarySigningService.ApiKey,
            UploadPreset = _cloudinarySigningService.UploadPreset,
            Folder = uploadFolder,
            PublicId = publicId,
            Overwrite = overwrite,
            Timestamp = timestamp,
            Signature = signature
        };

        return Ok(ApiResponse<CloudinaryUploadSignatureResponseDto>.Ok(response));
    }
}



