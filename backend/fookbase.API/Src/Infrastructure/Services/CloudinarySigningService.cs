using System.Security.Cryptography;
using System.Text;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class CloudinarySigningService : ICloudinarySigningService
{
    private readonly CloudinaryOptions _options;

    public CloudinarySigningService(IOptions<CloudinaryOptions> options)
    {
        _options = options.Value;
    }

    public string CloudName => _options.CloudName;

    public string ApiKey => _options.ApiKey;

    public string UploadPreset => _options.UploadPreset;

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_options.CloudName)
            && !string.IsNullOrWhiteSpace(_options.ApiKey)
            && !string.IsNullOrWhiteSpace(_options.ApiSecret)
            && !string.IsNullOrWhiteSpace(_options.UploadPreset);
    }

    public string BuildMediaUploadFolder(Guid userId)
    {
        var normalizedRoot = string.IsNullOrWhiteSpace(_options.UploadFolder)
            ? "fookbase/posts"
            : _options.UploadFolder.Trim().Trim('/');

        return $"{normalizedRoot}/{userId:D}";
    }

    public string GenerateSignature(SortedDictionary<string, string> parametersToSign)
    {
        var serializedParameters = string.Join(
            "&",
            parametersToSign.Select(pair => $"{pair.Key}={pair.Value}"));

        using var sha1 = SHA1.Create();
        var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes($"{serializedParameters}{_options.ApiSecret}"));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
