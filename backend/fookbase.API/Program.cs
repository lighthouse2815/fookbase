using System.Text;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Middleware;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Infrastructure.Data;
using InteractHub.Api.Infrastructure.Repositories;
using InteractHub.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

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
    options.UseSqlServer(appDbConnectionString, sqlOptions => sqlOptions.EnableRetryOnFailure()));

builder.Services.AddHttpClient<IJavaApiService, JavaApiService>(client =>
{
    var normalizedBaseUrl = javaApiBaseUrl.EndsWith('/') ? javaApiBaseUrl : $"{javaApiBaseUrl}/";
    client.BaseAddress = new Uri(normalizedBaseUrl, UriKind.Absolute);
});

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<IStoryRepository, StoryRepository>();
builder.Services.AddScoped<IHashtagRepository, HashtagRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPostReportRepository, PostReportRepository>();

builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<IPostReportService, PostReportService>();

builder.Services.AddControllers();
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

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey));
var validateIssuer = jwtOptions.ValidateIssuer && !string.IsNullOrWhiteSpace(jwtOptions.Issuer);
var validateAudience = jwtOptions.ValidateAudience && !string.IsNullOrWhiteSpace(jwtOptions.Audience);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = validateIssuer,
            ValidIssuer = validateIssuer ? jwtOptions.Issuer : null,
            ValidateAudience = validateAudience,
            ValidAudience = validateAudience ? jwtOptions.Audience : null,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authorizationHeader = context.Request.Headers.Authorization.ToString();
                var hasBearerTokenInHeader = authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);

                if (!hasBearerTokenInHeader
                    && context.Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
                    && !string.IsNullOrWhiteSpace(cookieToken))
                {
                    context.Token = cookieToken;
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
