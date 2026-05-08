using System.Security.Cryptography;
using System.Text;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class CloudinarySigningService : ICloudinarySigningService
{
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _uploadPreset;
    private readonly string _uploadFolder;

    public CloudinarySigningService(IOptions<CloudinaryOptions> options)
    {
        var configuredOptions = options.Value;
        _cloudName = Normalize(configuredOptions.CloudName);
        _apiKey = Normalize(configuredOptions.ApiKey);
        _apiSecret = Normalize(configuredOptions.ApiSecret);
        _uploadPreset = Normalize(configuredOptions.UploadPreset);
        _uploadFolder = Normalize(configuredOptions.UploadFolder);
    }

    public string CloudName => _cloudName;

    public string ApiKey => _apiKey;

    public string UploadPreset => _uploadPreset;

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_cloudName)
            && !string.IsNullOrWhiteSpace(_apiKey)
            && !string.IsNullOrWhiteSpace(_apiSecret)
            && !string.IsNullOrWhiteSpace(_uploadPreset);
    }

    public string BuildMediaUploadFolder(Guid userId)
    {
        var normalizedRoot = string.IsNullOrWhiteSpace(_uploadFolder)
            ? "fookbase/posts"
            : _uploadFolder.Trim('/');

        return $"{normalizedRoot}/{userId:D}";
    }

    public string GenerateSignature(SortedDictionary<string, string> parametersToSign)
    {
        ArgumentNullException.ThrowIfNull(parametersToSign);

        var serializedParameters = string.Join(
            "&",
            parametersToSign.Select(pair => $"{pair.Key}={pair.Value}"));

        using var sha1 = SHA1.Create();
        var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes($"{serializedParameters}{_apiSecret}"));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Normalize(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }
}
