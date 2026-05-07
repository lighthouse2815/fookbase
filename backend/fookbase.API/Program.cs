using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Interfaces.Services.Games;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Application.Services.Games;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Middleware;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Infrastructure.Data;
using InteractHub.Api.Infrastructure.Repositories;
using InteractHub.Api.Infrastructure.Services;
using InteractHub.Api.Presentation.Hubs;
using System.Security.Claims;
using System.Threading.RateLimiting;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection(CloudinaryOptions.SectionName));
builder.Services.Configure<RabbitMqReadModelOptions>(builder.Configuration.GetSection(RabbitMqReadModelOptions.SectionName));
builder.Services.Configure<UserReadModelOptions>(builder.Configuration.GetSection(UserReadModelOptions.SectionName));

var corsAllowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (corsAllowedOrigins is null || corsAllowedOrigins.Length == 0)
{
    corsAllowedOrigins =
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ];
}

var appDbConnectionString = builder.Configuration.GetConnectionString("AppDbConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:AppDbConnection is missing.");

builder.Services.Configure<JavaApiOptions>(builder.Configuration.GetSection(JavaApiOptions.SectionName));

var javaApiBaseUrl = builder.Configuration.GetValue<string>($"{JavaApiOptions.SectionName}:BaseUrl")
    ?? throw new InvalidOperationException($"{JavaApiOptions.SectionName}:BaseUrl is missing.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(appDbConnectionString, npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()));

builder.Services.AddHttpClient<IJavaApiService, JavaApiService>(client =>
{
    var normalizedBaseUrl = javaApiBaseUrl.EndsWith('/') ? javaApiBaseUrl : $"{javaApiBaseUrl}/";
    client.BaseAddress = new Uri(normalizedBaseUrl, UriKind.Absolute);
});

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICommentReportRepository, CommentReportRepository>();
builder.Services.AddScoped<ICommentReactionRepository, CommentReactionRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<IStoryRepository, StoryRepository>();
builder.Services.AddScoped<IStoryReactionRepository, StoryReactionRepository>();
builder.Services.AddScoped<IStoryReportRepository, StoryReportRepository>();
builder.Services.AddScoped<IHashtagRepository, HashtagRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPostReportRepository, PostReportRepository>();
builder.Services.AddScoped<IUserReportRepository, UserReportRepository>();
builder.Services.AddScoped<IAdminAuditLogRepository, AdminAuditLogRepository>();
builder.Services.AddScoped<ISavedPostRepository, SavedPostRepository>();
builder.Services.AddScoped<IAppReviewRepository, AppReviewRepository>();

builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ICommentReportService, CommentReportService>();
builder.Services.AddScoped<ICommentReactionService, CommentReactionService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IStoryReactionService, StoryReactionService>();
builder.Services.AddScoped<IStoryReportService, StoryReportService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<IPostReportService, PostReportService>();
builder.Services.AddScoped<IUserReportService, UserReportService>();
builder.Services.AddScoped<ISavedPostService, SavedPostService>();
builder.Services.AddScoped<IAdminAuditLogService, AdminAuditLogService>();
builder.Services.AddScoped<IAdminConsoleService, AdminConsoleService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<IAppReviewService, AppReviewService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITokenRoleService, TokenRoleService>();
builder.Services.AddScoped<IAuthCookieService, AuthCookieService>();
builder.Services.AddScoped<ICloudinarySigningService, CloudinarySigningService>();
builder.Services.AddScoped<INotificationRealtimeService, SignalRNotificationRealtimeService>();
builder.Services.AddScoped<UserReadModelService>();
builder.Services.AddScoped<IUserReadModelService>(serviceProvider => serviceProvider.GetRequiredService<UserReadModelService>());
builder.Services.AddScoped<IUserReadModelProjector>(serviceProvider => serviceProvider.GetRequiredService<UserReadModelService>());
builder.Services.AddHttpContextAccessor();
builder.Services.AddHostedService<RabbitMqReadModelConsumerService>();

builder.Services.AddSingleton<IGameRoomService, GameRoomService>();
builder.Services.AddSingleton<IChessService, ChessService>();
builder.Services.AddSingleton<ICaroService, CaroService>();
builder.Services.AddSingleton<ISnakeGameService, SnakeGameService>();
builder.Services.AddSingleton<IFlappyGameService, FlappyGameService>();
builder.Services.AddSingleton<IGameRealtimeService, SignalRGameRealtimeService>();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(pair => pair.Value?.Errors.Count > 0)
            .SelectMany(pair => pair.Value!.Errors)
            .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Invalid request." : error.ErrorMessage)
            .Distinct()
            .ToList();

        return new BadRequestObjectResult(ApiResponse<object>.Fail(errors));
    };
});

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var secretKey = builder.Configuration["JWT_SECRET_KEY"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            secretKey = jwtOptions.SecretKey;
        }

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("JWT secret is missing. Provide Jwt:SecretKey or JWT_SECRET_KEY.");
        }

        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = jwtOptions.ValidateIssuer,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = jwtOptions.ValidateAudience,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            NameClaimType = "sub",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var tokenFromAuthorization = context.Request.Headers.Authorization.ToString().NormalizeAccessTokenOrNull();
                if (!string.IsNullOrWhiteSpace(tokenFromAuthorization))
                {
                    context.Token = tokenFromAuthorization;
                    return Task.CompletedTask;
                }

                if (context.Request.Path.StartsWithSegments("/hubs")
                    && context.Request.Query.TryGetValue("access_token", out var accessTokenQueryValue))
                {
                    var tokenFromQuery = accessTokenQueryValue.ToString().NormalizeAccessTokenOrNull();
                    if (!string.IsNullOrWhiteSpace(tokenFromQuery))
                    {
                        context.Token = tokenFromQuery;
                        return Task.CompletedTask;
                    }
                }

                if (context.Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
                    && !string.IsNullOrWhiteSpace(cookieToken))
                {
                    context.Token = cookieToken.NormalizeAccessTokenOrNull();
                }

                return Task.CompletedTask;
            },
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail("Unauthorized."));
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail("Forbidden."));
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("CloudinarySignaturePolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetRateLimiterPartitionKey(context),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(corsAllowedOrigins)
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "InteractHub API",
        Version = "v1"
    });

    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

var enableHttpsRedirection = builder.Configuration.GetValue<bool?>("Security:EnableHttpsRedirection")
    ?? !app.Environment.IsDevelopment();
var migrateOnStartup = builder.Configuration.GetValue("Database:MigrateOnStartup", true);
var migrationRetryCount = Math.Max(1, builder.Configuration.GetValue("Database:MigrationRetryCount", 5));
var migrationRetryDelaySeconds = Math.Max(1, builder.Configuration.GetValue("Database:MigrationRetryDelaySeconds", 3));
var failFastOnMigrationError = builder.Configuration.GetValue<bool?>("Database:FailFastOnMigrationError")
    ?? !app.Environment.IsDevelopment();

if (migrateOnStartup)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Exception? migrationException = null;

    for (var attempt = 1; attempt <= migrationRetryCount; attempt++)
    {
        try
        {
            dbContext.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully on startup.");
            migrationException = null;
            break;
        }
        catch (Exception exception)
        {
            migrationException = exception;

            logger.LogWarning(
                exception,
                "Failed to apply database migrations (attempt {Attempt}/{RetryCount}).",
                attempt,
                migrationRetryCount);

            if (attempt < migrationRetryCount)
            {
                Thread.Sleep(TimeSpan.FromSeconds(migrationRetryDelaySeconds));
            }
        }
    }

    if (migrationException is not null)
    {
        if (failFastOnMigrationError)
        {
            logger.LogCritical(
                migrationException,
                "Database migrations failed after {RetryCount} attempts. Application startup aborted.",
                migrationRetryCount);

            throw new InvalidOperationException(
                $"Database migrations failed after {migrationRetryCount} attempts.",
                migrationException);
        }

        logger.LogError(
            migrationException,
            "Database migrations failed after {RetryCount} attempts. Application will continue to run.",
            migrationRetryCount);
    }
}

app.UseMiddleware<GlobalExceptionMiddleware>();

if (enableHttpsRedirection)
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapHub<GamesHub>("/hubs/games");

app.Run();

static string GetRateLimiterPartitionKey(HttpContext context)
{
    var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? context.User.FindFirstValue("sub");

    if (!string.IsNullOrWhiteSpace(userId))
    {
        return $"user:{userId}";
    }

    return $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
}
