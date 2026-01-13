using Hangfire;
using Microsoft.EntityFrameworkCore;
using Minio;
using NLog;
using NLog.Web;
using Project.Api.Hubs;
using Project.Core;
using Project.Service;
using Project.Service.Common;
using Project.Service.Dtos.CM;
using Project.Service.Services;
using Project.Service.Services.AD;
using Project.Service.Services.MT;

var logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();

try
{
    var frontendFolder = "fe";
    var builder = WebApplication.CreateBuilder(args);

    builder.Logging.ClearProviders();
    builder.Host.UseNLog();

    builder.Services.AddDIServices(builder.Configuration);
    builder.Services.AddDIServicesCore(builder.Configuration);
    builder.Services.AddHttpContextAccessor();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
    );

    if (builder.Configuration.GetValue<bool>("Redis:Enabled"))
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = builder.Configuration["Redis:ConnectionString"];
            options.InstanceName = builder.Configuration["Redis:InstanceName"];
        });
    }
    else
    {
        // Use in-memory cache if Redis is disabled
        builder.Services.AddDistributedMemoryCache(options =>
        {
            options.SizeLimit = 52428800; // 50MB max cache size
        });
    }

    builder.Services.Configure<MinioConfigDto>(builder.Configuration.GetSection("Minio"));

    builder.Services.AddSingleton(sp =>
    {
        var config = builder.Configuration.GetSection("Minio").Get<MinioConfigDto>();

        return new MinioClient()
            .WithEndpoint(config.Endpoint, config.Port)
            .WithCredentials(config.AccessKey, config.SecretKey)
            .WithSSL(config.UseSSL)
            .Build();
    });

    builder.Services.AddHangfire(config =>
    {
        config.UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection"));
    });
    builder.Services.AddHangfireServer();

    builder.Services.AddControllers();
    builder.Services.AddSpaStaticFiles(options => options.RootPath = frontendFolder);
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddSignalR();
    
    // Configure CORS based on environment
    var allowedOrigins = builder.Configuration["CORS:AllowedOrigins"]?.Split(",") ?? new[] { "*" };
    builder.Services.AddCors(options => options.AddPolicy("CorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .WithExposedHeaders("Accept-Ranges", "Content-Range", "Content-Length", "Content-Disposition", "Content-Type");
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .WithExposedHeaders("Accept-Ranges", "Content-Range", "Content-Length", "Content-Disposition", "Content-Type");
        }
    }));
    builder.Services.AddScoped<BackgroundJobService>();

    var app = builder.Build();
    ServiceProviderAccessor.Instance = app.Services;

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    app.UseHttpsRedirection();

    app.UseCors("CorsPolicy");
    app.UseHangfireDashboard("/hangfire");
    app.MapHub<NotificationHub>("/api/Hub/Notification");
    app.UseAuthorization();

    app.UseStaticFiles();

    app.Use(async (context, next) =>
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        if (path.StartsWith("/api/"))
        {
            await next();

            if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"API endpoint not found\",\"path\":\"" + context.Request.Path + "\"}");
                return;
            }
        }
        else
        {
            await next();
        }
    });

    app.MapControllers();

    // Health check endpoint for Render monitoring
    app.MapGet("/health", async (AppDbContext dbContext) =>
    {
        try
        {
            await dbContext.Database.CanConnectAsync();
            return Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            return Results.StatusCode(503, new { status = "unhealthy", error = ex.Message });
        }
    });

    if (Directory.Exists(Path.Combine(app.Environment.ContentRootPath, frontendFolder)))
    {
        app.UseSpaStaticFiles();
        app.UseSpa(spa =>
        {
            spa.Options.SourcePath = frontendFolder;

            spa.Options.DefaultPageStaticFileOptions = new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    var requestPath = ctx.Context.Request.Path.Value?.ToLower() ?? "";

                    if (requestPath.StartsWith("/api/") ||
                        requestPath.StartsWith("/swagger") ||
                        requestPath.StartsWith("/health") ||
                        requestPath.StartsWith("/hangfire"))
                    {
                        ctx.Context.Response.StatusCode = 404;
                        ctx.Context.Response.ContentLength = 0;
                        ctx.Context.Response.Body = Stream.Null;
                    }
                }
            };
        });
    }

    using (var scope = app.Services.CreateScope())
    {
        var messageCache = scope.ServiceProvider.GetRequiredService<IMessageCacheService>();
        await messageCache.SyncFromDatabaseAsync(CancellationToken.None);

        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        //var meetingService = scope.ServiceProvider.GetRequiredService<IMeetingInfoService>();
        //var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();
        //var backgroundJobService = new BackgroundJobService(dbContext, httpClient, builder.Configuration);
        //var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

        RecurringJob.AddOrUpdate(
            "Sync Message Cache",
            () => messageCache.SyncFromDatabaseAsync(CancellationToken.None),
            Cron.MinuteInterval(30)
        );
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

        recurringJobManager.AddOrUpdate<BackgroundJobService>(
            "AutoEndMeetingVote",
            x => x.AutoEndMeetingVote(),
            "0 * * * *" 
        );
    }

    app.Run();
}
catch (Exception ex)
{
    logger.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    logger.Info("Application shutting down...");
    LogManager.Shutdown();
}