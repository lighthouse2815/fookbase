namespace InteractHub.Api.Common.Models;

public class RabbitMqReadModelOptions
{
    public const string SectionName = "RabbitMqReadModel";

    public bool Enabled { get; set; }

    public string HostName { get; set; } = "localhost";

    public int Port { get; set; } = 5672;

    public string VirtualHost { get; set; } = "/";

    public string UserName { get; set; } = "guest";

    public string Password { get; set; } = "guest";

    public string ExchangeName { get; set; } = "fookbase.domain.events";

    public string QueueName { get; set; } = "fookbase.read-model.csharp";

    public string[] RoutingKeys { get; set; } =
    [
        "user.profile.updated",
        "user.blocked",
        "user.unblocked",
        "friendship.created",
        "friendship.accepted",
        "friendship.removed",
        "presence.#",
        "user.presence.#",
        "friend.presence.#"
    ];

    public ushort PrefetchCount { get; set; } = 32;
}



