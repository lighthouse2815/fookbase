using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class AdminConsoleServiceTests
{
    private readonly Mock<IAccessTokenProvider> _accessTokenProviderMock = new();
    private readonly Mock<IJavaAdminApiService> _javaAdminApiServiceMock = new();
    private readonly Mock<IPostRepository> _postRepositoryMock = new();
    private readonly Mock<IHashtagRepository> _hashtagRepositoryMock = new();
    private readonly Mock<IPostReportRepository> _postReportRepositoryMock = new();
    private readonly Mock<ICommentReportRepository> _commentReportRepositoryMock = new();
    private readonly Mock<IUserReportRepository> _userReportRepositoryMock = new();
    private readonly Mock<IStoryReportRepository> _storyReportRepositoryMock = new();
    private readonly Mock<IAdminAuditLogService> _adminAuditLogServiceMock = new();
    private readonly Mock<ILogger<AdminConsoleService>> _loggerMock = new();

    private AdminConsoleService CreateService()
    {
        _accessTokenProviderMock
            .Setup(provider => provider.GetAccessTokenOrNull())
            .Returns("token");

        return new AdminConsoleService(
            _accessTokenProviderMock.Object,
            _javaAdminApiServiceMock.Object,
            _postRepositoryMock.Object,
            _hashtagRepositoryMock.Object,
            _postReportRepositoryMock.Object,
            _commentReportRepositoryMock.Object,
            _userReportRepositoryMock.Object,
            _storyReportRepositoryMock.Object,
            _adminAuditLogServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetDashboardAsync_UsesUtcMonthStart_ForPostAggregation()
    {
        DateTime? capturedSinceUtc = null;

        _javaAdminApiServiceMock
            .Setup(service => service.GetAdminUserStatsAsync("token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<AdminUserStatsDto>.Success(
                new AdminUserStatsDto
                {
                    TotalUsers = 100,
                    ActiveUsers = 90,
                    BannedUsers = 5,
                    InactiveUsers = 5,
                    MonthlyCreatedUsers =
                    [
                        new AdminMonthlyCountDto
                        {
                            Month = "2026-05",
                            Count = 20
                        }
                    ]
                },
                StatusCodes.Status200OK));

        _postRepositoryMock
            .Setup(repository => repository.CountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(10);
        _postRepositoryMock
            .Setup(repository => repository.GetCreatedDatesSinceAsync(It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<DateTime, CancellationToken>((sinceUtc, _) => capturedSinceUtc = sinceUtc)
            .ReturnsAsync(
            [
                new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc)
            ]);

        _postReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _commentReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);
        _userReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);
        _storyReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);

        var service = CreateService();
        var result = await service.GetDashboardAsync(CancellationToken.None);

        Assert.NotNull(capturedSinceUtc);
        Assert.Equal(DateTimeKind.Utc, capturedSinceUtc!.Value.Kind);
        Assert.Equal(new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc), capturedSinceUtc.Value);

        var monthlyMetric = Assert.Single(result.MonthlyMetrics);
        Assert.Equal("2026-05", monthlyMetric.Month);
        Assert.Equal(1, monthlyMetric.Posts);
    }

    [Fact]
    public async Task GetDashboardAsync_ThrowsValidationError_WhenMonthFormatIsInvalid()
    {
        _javaAdminApiServiceMock
            .Setup(service => service.GetAdminUserStatsAsync("token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<AdminUserStatsDto>.Success(
                new AdminUserStatsDto
                {
                    MonthlyCreatedUsers =
                    [
                        new AdminMonthlyCountDto
                        {
                            Month = "2026/05",
                            Count = 1
                        }
                    ]
                },
                StatusCodes.Status200OK));

        _postRepositoryMock
            .Setup(repository => repository.CountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _postReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _commentReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _userReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _storyReportRepositoryMock
            .Setup(repository => repository.CountByStatusAsync(ReportStatus.PENDING, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(
            () => service.GetDashboardAsync(CancellationToken.None));

        Assert.Equal(ErrorCode.VALIDATION_ERROR, exception.ErrorCode);
    }
}
