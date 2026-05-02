using System.Text;
using System.Text.Json;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace InteractHub.Api.Infrastructure.Services;

public class RabbitMqReadModelConsumerService : BackgroundService
{
    private static readonly HashSet<string> ProfileEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "user.profile.updated",
        "user_profile_updated",
        "profile.updated",
        "user-summary-updated",
        "user.summary.updated"
    };

    private static readonly HashSet<string> BlockEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "user.blocked",
        "user.unblocked",
        "friendship.blocked",
        "friendship.unblocked",
        "user.block.status.changed",
        "user_block_status_changed"
    };

    private static readonly HashSet<string> FriendshipActiveEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "friendship.created",
        "friendship.accepted",
        "friendship.restored",
        "friendship.active",
        "friendship_active"
    };

    private static readonly HashSet<string> FriendshipInactiveEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "friendship.removed",
        "friendship.rejected",
        "friendship.cancelled",
        "friendship.inactive",
        "friendship_inactive"
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<RabbitMqReadModelOptions> _optionsAccessor;
    private readonly ILogger<RabbitMqReadModelConsumerService> _logger;

    public RabbitMqReadModelConsumerService(
        IServiceScopeFactory scopeFactory,
        IOptions<RabbitMqReadModelOptions> optionsAccessor,
        ILogger<RabbitMqReadModelConsumerService> logger)
    {
        _scopeFactory = scopeFactory;
        _optionsAccessor = optionsAccessor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = _optionsAccessor.Value;
        if (!options.Enabled)
        {
            _logger.LogInformation("RabbitMQ read-model consumer is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunConsumerAsync(options, stoppingToken);
                return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "RabbitMQ read-model consumer failed. Retrying in 5 seconds.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task RunConsumerAsync(RabbitMqReadModelOptions options, CancellationToken stoppingToken)
    {
        var connectionFactory = new ConnectionFactory
        {
            HostName = options.HostName,
            Port = options.Port,
            VirtualHost = options.VirtualHost,
            UserName = options.UserName,
            Password = options.Password,
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true,
            TopologyRecoveryEnabled = true
        };

        using var connection = connectionFactory.CreateConnection();
        using var channel = connection.CreateModel();

        channel.ExchangeDeclare(
            exchange: options.ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false);

        channel.QueueDeclare(
            queue: options.QueueName,
            durable: true,
            exclusive: false,
            autoDelete: false);

        var routingKeys = options.RoutingKeys
            .Where(routingKey => !string.IsNullOrWhiteSpace(routingKey))
            .Select(routingKey => routingKey.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (routingKeys.Count == 0)
        {
            routingKeys.Add("#");
        }

        foreach (var routingKey in routingKeys)
        {
            channel.QueueBind(
                queue: options.QueueName,
                exchange: options.ExchangeName,
                routingKey: routingKey);
        }

        channel.BasicQos(0, options.PrefetchCount, global: false);

        _logger.LogInformation(
            "RabbitMQ read-model consumer started. Queue={QueueName}, Exchange={ExchangeName}, Keys={RoutingKeys}",
            options.QueueName,
            options.ExchangeName,
            string.Join(", ", routingKeys));

        using var consumeLock = new SemaphoreSlim(1, 1);
        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.Received += async (_, eventArgs) =>
        {
            var lockAcquired = false;
            try
            {
                await consumeLock.WaitAsync(stoppingToken);
                lockAcquired = true;

                var handled = await HandleMessageAsync(eventArgs.Body, stoppingToken);
                if (handled)
                {
                    channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
                    return;
                }

                channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to process RabbitMQ read-model event. DeliveryTag={DeliveryTag}", eventArgs.DeliveryTag);
                channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: false);
            }
            finally
            {
                if (lockAcquired)
                {
                    consumeLock.Release();
                }
            }
        };

        channel.BasicConsume(
            queue: options.QueueName,
            autoAck: false,
            consumer: consumer);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task<bool> HandleMessageAsync(ReadOnlyMemory<byte> body, CancellationToken cancellationToken)
    {
        if (body.IsEmpty)
        {
            return true;
        }

        var message = Encoding.UTF8.GetString(body.Span);
        if (string.IsNullOrWhiteSpace(message))
        {
            return true;
        }

        using var document = JsonDocument.Parse(message);
        var root = document.RootElement;
        var payload = ResolvePayload(root);
        var eventType = ResolveEventType(root);
        var observedAtUtc = ResolveObservedAtUtc(root, payload);

        using var scope = _scopeFactory.CreateScope();
        var projector = scope.ServiceProvider.GetRequiredService<IUserReadModelProjector>();

        if (IsProfileEvent(eventType, payload) && TryResolveProfile(payload, out var profile))
        {
            await projector.UpsertProfileAsync(
                profile.UserId,
                profile.DisplayName,
                profile.AvatarUrl,
                observedAtUtc,
                cancellationToken);

            return true;
        }

        if (IsBlockEvent(eventType, payload) && TryResolveBlockEvent(payload, out var blockEvent))
        {
            await projector.SetBlockedRelationAsync(
                blockEvent.OwnerUserId,
                blockEvent.BlockedUserId,
                blockEvent.IsBlocked,
                observedAtUtc,
                cancellationToken);

            return true;
        }

        if (IsFriendshipEvent(eventType, payload, out var defaultIsActive)
            && TryResolveFriendshipEvent(payload, defaultIsActive, out var friendshipEvent))
        {
            await projector.SetFriendshipAsync(
                friendshipEvent.FirstUserId,
                friendshipEvent.SecondUserId,
                friendshipEvent.IsActive,
                observedAtUtc,
                cancellationToken);

            return true;
        }

        _logger.LogWarning("Ignoring unknown RabbitMQ read-model event. EventType={EventType}, Payload={Payload}", eventType, payload.GetRawText());
        return true;
    }

    private static JsonElement ResolvePayload(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("payload", out var payload)
            && payload.ValueKind == JsonValueKind.Object)
        {
            return payload;
        }

        return root;
    }

    private static string ResolveEventType(JsonElement root)
    {
        var candidates = new[]
        {
            GetString(root, "eventType"),
            GetString(root, "type"),
            GetString(root, "name")
        };

        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return candidate.Trim();
            }
        }

        return "unknown";
    }

    private static DateTime? ResolveObservedAtUtc(JsonElement root, JsonElement payload)
    {
        var candidates = new[]
        {
            GetDateTime(root, "occurredAt"),
            GetDateTime(root, "timestamp"),
            GetDateTime(root, "createdAt"),
            GetDateTime(payload, "occurredAt"),
            GetDateTime(payload, "updatedAt"),
            GetDateTime(payload, "createdAt")
        };

        return candidates.FirstOrDefault(candidate => candidate.HasValue);
    }

    private static bool IsProfileEvent(string eventType, JsonElement payload)
    {
        if (ProfileEventTypes.Contains(eventType))
        {
            return true;
        }

        return HasAnyProperty(payload, "displayName", "avatarUrl");
    }

    private static bool IsBlockEvent(string eventType, JsonElement payload)
    {
        if (BlockEventTypes.Contains(eventType))
        {
            return true;
        }

        return HasAnyProperty(payload, "blockedUserId", "targetUserId", "addresseeId", "otherUserId")
            && (HasAnyProperty(payload, "ownerUserId", "userId", "requesterId")
                || HasAnyProperty(payload, "actorUserId"));
    }

    private static bool IsFriendshipEvent(string eventType, JsonElement payload, out bool defaultIsActive)
    {
        if (FriendshipActiveEventTypes.Contains(eventType))
        {
            defaultIsActive = true;
            return true;
        }

        if (FriendshipInactiveEventTypes.Contains(eventType))
        {
            defaultIsActive = false;
            return true;
        }

        if (HasAnyProperty(payload, "firstUserId", "requesterId", "userId", "userA")
            && HasAnyProperty(payload, "secondUserId", "addresseeId", "friendUserId", "userB"))
        {
            defaultIsActive = true;
            return true;
        }

        defaultIsActive = false;
        return false;
    }

    private static bool TryResolveProfile(JsonElement payload, out (Guid UserId, string? DisplayName, string? AvatarUrl) profile)
    {
        profile = default;
        if (!TryReadGuid(payload, out var userId, "userId", "id"))
        {
            return false;
        }

        profile = (
            UserId: userId,
            DisplayName: GetString(payload, "displayName"),
            AvatarUrl: GetString(payload, "avatarUrl"));
        return true;
    }

    private static bool TryResolveBlockEvent(JsonElement payload, out (Guid OwnerUserId, Guid BlockedUserId, bool IsBlocked) blockEvent)
    {
        blockEvent = default;
        if (!TryReadGuid(payload, out var ownerUserId, "ownerUserId", "userId", "requesterId", "actorUserId"))
        {
            return false;
        }

        if (!TryReadGuid(payload, out var blockedUserId, "blockedUserId", "targetUserId", "addresseeId", "otherUserId"))
        {
            return false;
        }

        var isBlocked = GetBoolean(payload, "isBlocked") ?? true;
        blockEvent = (ownerUserId, blockedUserId, isBlocked);
        return true;
    }

    private static bool TryResolveFriendshipEvent(
        JsonElement payload,
        bool defaultIsActive,
        out (Guid FirstUserId, Guid SecondUserId, bool IsActive) friendshipEvent)
    {
        friendshipEvent = default;
        if (!TryReadFriendshipUsers(payload, out var firstUserId, out var secondUserId))
        {
            return false;
        }

        var isActive = GetBoolean(payload, "isActive");
        if (!isActive.HasValue)
        {
            var status = GetString(payload, "status");
            if (!string.IsNullOrWhiteSpace(status))
            {
                isActive = status.Equals("accepted", StringComparison.OrdinalIgnoreCase)
                    || status.Equals("active", StringComparison.OrdinalIgnoreCase)
                    || status.Equals("friends", StringComparison.OrdinalIgnoreCase);
            }
        }

        friendshipEvent = (firstUserId, secondUserId, isActive ?? defaultIsActive);
        return true;
    }

    private static bool TryReadFriendshipUsers(JsonElement payload, out Guid firstUserId, out Guid secondUserId)
    {
        firstUserId = Guid.Empty;
        secondUserId = Guid.Empty;

        if (TryReadGuid(payload, out firstUserId, "firstUserId", "requesterId", "userId", "userA")
            && TryReadGuid(payload, out secondUserId, "secondUserId", "addresseeId", "friendUserId", "userB"))
        {
            return firstUserId != Guid.Empty && secondUserId != Guid.Empty && firstUserId != secondUserId;
        }

        return false;
    }

    private static bool TryReadGuid(JsonElement source, out Guid value, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!source.TryGetProperty(propertyName, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.String
                && Guid.TryParse(property.GetString(), out value))
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.Object
                && property.TryGetProperty("id", out var idElement)
                && idElement.ValueKind == JsonValueKind.String
                && Guid.TryParse(idElement.GetString(), out value))
            {
                return true;
            }
        }

        value = Guid.Empty;
        return false;
    }

    private static bool? GetBoolean(JsonElement source, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!source.TryGetProperty(propertyName, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.True)
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.False)
            {
                return false;
            }

            if (property.ValueKind == JsonValueKind.String
                && bool.TryParse(property.GetString(), out var parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static DateTime? GetDateTime(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        if (property.ValueKind == JsonValueKind.String
            && DateTime.TryParse(property.GetString(), out var parsed))
        {
            return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
        }

        return null;
    }

    private static string? GetString(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String ? property.GetString() : null;
    }

    private static bool HasAnyProperty(JsonElement source, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (source.TryGetProperty(propertyName, out _))
            {
                return true;
            }
        }

        return false;
    }
}
