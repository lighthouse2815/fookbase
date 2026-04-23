using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        IJavaApiService javaApiService,
        INotificationRealtimeService notificationRealtimeService,
        IUnitOfWork unitOfWork,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _javaApiService = javaApiService;
        _notificationRealtimeService = notificationRealtimeService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<NotificationResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _notificationRepository.GetPagedByUserIdAsync(userId, query.Page, query.PageSize, cancellationToken);
        var actorProfiles = await ResolveActorProfilesAsync(items.Select(notification => notification.ActorUserId), cancellationToken);
        var mappedItems = items
            .Select(notification => MapNotification(notification, actorProfiles))
            .ToList();

        return PagedResult<NotificationResponseDto>.Create(
            mappedItems,
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<NotificationResponseDto> GetByIdAsync(
        Guid notificationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to access this notification.");

        return await MapNotificationAsync(notification, cancellationToken);
    }

    public async Task<NotificationResponseDto> CreateAsync(CreateNotificationRequestDto request, CancellationToken cancellationToken)
    {
        var targetUser = await _javaApiService.GetUserById(request.UserId, cancellationToken)
            ?? throw new NotFoundException("Target user not found.");

        var actorUser = await _javaApiService.GetUserById(request.ActorUserId, cancellationToken)
            ?? throw new NotFoundException("Actor user not found.");

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            ActorUserId = actorUser.Id,
            PostId = request.PostId,
            CommentId = request.CommentId,
            Type = request.Type.Trim().ToUpperInvariant(),
            Message = request.Message.Trim(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = await MapNotificationAsync(notification, cancellationToken);
        await _notificationRealtimeService.NotifyCreatedAsync(response, cancellationToken);

        return response;
    }

    public async Task<NotificationResponseDto> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to update this notification.");

        notification.IsRead = true;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = await MapNotificationAsync(notification, cancellationToken);
        await _notificationRealtimeService.NotifyUpdatedAsync(response, cancellationToken);

        return response;
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        var unreadNotifications = await _notificationRepository.GetUnreadByUserIdForUpdateAsync(userId, cancellationToken);
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyMarkedAllReadAsync(userId, cancellationToken);
    }

    public async Task DeleteAsync(Guid notificationId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to delete this notification.");

        _notificationRepository.Remove(notification);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyDeletedAsync(notification.UserId, notification.Id, cancellationToken);
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
    }

    private async Task<NotificationResponseDto> MapNotificationAsync(
        Notification notification,
        CancellationToken cancellationToken)
    {
        var actorProfiles = await ResolveActorProfilesAsync([notification.ActorUserId], cancellationToken);
        return MapNotification(notification, actorProfiles);
    }

    private static NotificationResponseDto MapNotification(
        Notification notification,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> actorProfiles)
    {
        var actorProfile = actorProfiles.TryGetValue(notification.ActorUserId, out var profile)
            ? profile
            : null;

        return notification.ToResponseDto(
            actorProfile?.DisplayName.TrimToNull(),
            actorProfile?.AvatarUrl.TrimToNull());
    }

    private async Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveActorProfilesAsync(
        IEnumerable<Guid> actorUserIds,
        CancellationToken cancellationToken)
    {
        var distinctActorUserIds = actorUserIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctActorUserIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto?>();
        }

        var profileTasks = distinctActorUserIds.Select(async actorUserId =>
        {
            try
            {
                var profile = await _javaApiService.GetProfileSummaryByUserId(
                    actorUserId,
                    cancellationToken: cancellationToken);

                return new KeyValuePair<Guid, UserProfileSummaryDto?>(actorUserId, profile);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Could not resolve actor profile summary for notification actor {ActorUserId}.",
                    actorUserId);

                return new KeyValuePair<Guid, UserProfileSummaryDto?>(actorUserId, null);
            }
        });

        var resolvedProfiles = await Task.WhenAll(profileTasks);
        return resolvedProfiles.ToDictionary(item => item.Key, item => item.Value);
    }

}
