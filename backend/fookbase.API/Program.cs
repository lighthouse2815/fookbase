using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Middleware;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Infrastructure.Data;
using InteractHub.Api.Infrastructure.Repositories;
using InteractHub.Api.Infrastructure.Services;
using InteractHub.Api.Presentation.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "BearerOrCookie";
        options.DefaultChallengeScheme = "BearerOrCookie";
        options.DefaultForbidScheme = "BearerOrCookie";
    })
    .AddScheme<AuthenticationSchemeOptions, BearerOrCookieAuthenticationHandler>("BearerOrCookie", _ => { });

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
            Id = "BearerOrCookie",
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
