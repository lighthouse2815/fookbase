using System.Collections.Generic;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICloudinarySigningService
{
    string CloudName { get; }

    string ApiKey { get; }

    string UploadPreset { get; }

    bool IsConfigured();

    string BuildMediaUploadFolder(Guid userId);

    string GenerateSignature(SortedDictionary<string, string> parametersToSign);
}



