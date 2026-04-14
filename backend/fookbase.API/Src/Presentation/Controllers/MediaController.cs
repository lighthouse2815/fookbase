using System.Security.Cryptography;
using System.Text;
using InteractHub.Api.Application.DTOs.Media;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ApiControllerBase
{
    private readonly CloudinaryOptions _cloudinaryOptions;

    public MediaController(IOptions<CloudinaryOptions> cloudinaryOptions)
    {
        _cloudinaryOptions = cloudinaryOptions.Value;
    }

    [HttpGet("cloudinary-signature")]
    [Authorize]
    [EnableRateLimiting("CloudinarySignaturePolicy")]
    [ProducesResponseType(typeof(ApiResponse<CloudinaryUploadSignatureResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CloudinaryUploadSignatureResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public ActionResult<ApiResponse<CloudinaryUploadSignatureResponseDto>> GetCloudinaryUploadSignature()
    {
        if (!IsCloudinaryConfigured(_cloudinaryOptions))
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<CloudinaryUploadSignatureResponseDto>.Fail("Cloudinary signing is not configured."));
        }

        var userId = GetCurrentUserId();
        var uploadFolder = BuildUploadFolder(_cloudinaryOptions.UploadFolder, userId);
        var publicId = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}";
        const bool overwrite = false;
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var parametersToSign = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = uploadFolder,
            ["overwrite"] = overwrite.ToString().ToLowerInvariant(),
            ["public_id"] = publicId,
            ["timestamp"] = timestamp.ToString(),
            ["upload_preset"] = _cloudinaryOptions.UploadPreset
        };

        var signature = GenerateCloudinarySignature(parametersToSign, _cloudinaryOptions.ApiSecret);

        var response = new CloudinaryUploadSignatureResponseDto
        {
            CloudName = _cloudinaryOptions.CloudName,
            ApiKey = _cloudinaryOptions.ApiKey,
            UploadPreset = _cloudinaryOptions.UploadPreset,
            Folder = uploadFolder,
            PublicId = publicId,
            Overwrite = overwrite,
            Timestamp = timestamp,
            Signature = signature
        };

        return Ok(ApiResponse<CloudinaryUploadSignatureResponseDto>.Ok(response));
    }

    private static bool IsCloudinaryConfigured(CloudinaryOptions options)
    {
        return !string.IsNullOrWhiteSpace(options.CloudName)
            && !string.IsNullOrWhiteSpace(options.ApiKey)
            && !string.IsNullOrWhiteSpace(options.ApiSecret)
            && !string.IsNullOrWhiteSpace(options.UploadPreset);
    }

    private static string GenerateCloudinarySignature(SortedDictionary<string, string> parametersToSign, string apiSecret)
    {
        var serializedParameters = string.Join(
            "&",
            parametersToSign.Select(pair => $"{pair.Key}={pair.Value}"));

        using var sha1 = SHA1.Create();
        var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes($"{serializedParameters}{apiSecret}"));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string BuildUploadFolder(string configuredFolder, Guid userId)
    {
        var normalizedRoot = string.IsNullOrWhiteSpace(configuredFolder)
            ? "fookbase/posts"
            : configuredFolder.Trim().Trim('/');

        return $"{normalizedRoot}/{userId:D}";
    }
}
