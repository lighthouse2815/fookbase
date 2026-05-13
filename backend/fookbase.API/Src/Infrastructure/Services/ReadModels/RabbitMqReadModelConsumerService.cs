using System.Text;
using System.Text.Json;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace InteractHub.Api.Infrastructure.Services.ReadModels;

public class RabbitMqReadModelConsumerService : BackgroundService
{
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
        var payload = RabbitMqReadModelEventMapper.ResolvePayload(root);
        var eventType = RabbitMqReadModelEventMapper.ResolveEventType(root);
        var observedAtUtc = RabbitMqReadModelEventMapper.ResolveObservedAtUtc(root, payload);

        using var scope = _scopeFactory.CreateScope();

        if (RabbitMqReadModelEventMapper.IsProfileEvent(eventType, payload)
            && RabbitMqReadModelEventMapper.TryResolveProfile(payload, out var profile))
        {
            var profileProjector = scope.ServiceProvider.GetRequiredService<IUserProfileSummaryReadModelService>();
            await profileProjector.UpsertProfileAsync(
                profile.UserId,
                profile.DisplayName,
                profile.AvatarUrl,
                observedAtUtc,
                cancellationToken);

            return true;
        }

        if (RabbitMqReadModelEventMapper.IsBlockEvent(eventType, payload)
            && RabbitMqReadModelEventMapper.TryResolveBlockEvent(payload, out var blockEvent))
        {
            var blockProjector = scope.ServiceProvider.GetRequiredService<IFriendshipReadModelService>();
            await blockProjector.SetBlockedRelationAsync(
                blockEvent.OwnerUserId,
                blockEvent.BlockedUserId,
                blockEvent.IsBlocked,
                observedAtUtc,
                cancellationToken);

            return true;
        }

        if (RabbitMqReadModelEventMapper.IsFriendshipEvent(eventType, payload, out var defaultIsActive)
            && RabbitMqReadModelEventMapper.TryResolveFriendshipEvent(payload, defaultIsActive, out var friendshipEvent))
        {
            var friendshipProjector = scope.ServiceProvider.GetRequiredService<IFriendshipReadModelService>();
            await friendshipProjector.SetFriendshipAsync(
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
}



