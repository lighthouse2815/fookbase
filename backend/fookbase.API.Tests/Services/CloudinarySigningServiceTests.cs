using InteractHub.Api.Common.Models;
using InteractHub.Api.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Tests.Services;

public class CloudinarySigningServiceTests
{
    [Fact]
    public void IsConfigured_ReturnsTrue_WhenCloudinaryValuesHaveWhitespace()
    {
        var options = Options.Create(new CloudinaryOptions
        {
            CloudName = " drfhezlyn \r\n",
            ApiKey = " 339282683418845 ",
            ApiSecret = " wmKxVEIEeKAmTR-BmYHfO9F6ugs \r\n",
            UploadPreset = " fookbase \r\n",
            UploadFolder = " fookbase/posts/ "
        });

        var service = new CloudinarySigningService(options);

        Assert.True(service.IsConfigured());
        Assert.Equal("drfhezlyn", service.CloudName);
        Assert.Equal("339282683418845", service.ApiKey);
        Assert.Equal("fookbase", service.UploadPreset);
    }

    [Fact]
    public void BuildMediaUploadFolder_UsesNormalizedRoot()
    {
        var options = Options.Create(new CloudinaryOptions
        {
            CloudName = "cloud",
            ApiKey = "key",
            ApiSecret = "secret",
            UploadPreset = "preset",
            UploadFolder = "  custom/root/  "
        });

        var service = new CloudinarySigningService(options);

        var folder = service.BuildMediaUploadFolder(Guid.Parse("11111111-2222-3333-4444-555555555555"));

        Assert.Equal("custom/root/11111111-2222-3333-4444-555555555555", folder);
    }

    [Fact]
    public void GenerateSignature_UsesNormalizedSecret()
    {
        var options = Options.Create(new CloudinaryOptions
        {
            CloudName = "cloud",
            ApiKey = "key",
            ApiSecret = " secret \r\n",
            UploadPreset = "preset"
        });

        var service = new CloudinarySigningService(options);

        var parametersToSign = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = "test",
            ["timestamp"] = "123"
        };

        var signature = service.GenerateSignature(parametersToSign);

        Assert.Equal("fdbf35df326763443b6160f5af6c6303fd6f5830", signature);
    }
}
