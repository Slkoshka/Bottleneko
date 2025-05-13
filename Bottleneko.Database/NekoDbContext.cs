using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Bottleneko.Database.Schema.Protocols;
using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Database.Schema.Protocols.Twitch;
using Bottleneko.Logging;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata.Conventions.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.DependencyInjection;

namespace Bottleneko.Database;

static class JsonOptions
{
    public static JsonSerializerOptions JsonSerializerOptions { get; }= new()
    {
        AllowOutOfOrderMetadataProperties = true,
        Converters = { new JsonStringEnumConverter() },
    };
}

class JsonValueConverter<T>(ConverterMappingHints? mappingHints = null) : ValueConverter<T, string>(value => ToJson(value), value => FromJson(value), mappingHints)
{
    private static string ToJson(T value)
    {
        return JsonSerializer.Serialize(value, JsonOptions.JsonSerializerOptions);
    }

    private static T FromJson(string? value)
    {
        return value is null ? default! : JsonSerializer.Deserialize<T>(value, JsonOptions.JsonSerializerOptions)!;
    }
}

public class NekoDbContextFactory : IDesignTimeDbContextFactory<NekoDbContext>
{
    public NekoDbContext CreateDbContext(string[] args) => NekoDbContext.CreateDesignTimeDbContext(args);
}

public class NekoDbContext(DbContextOptions options) : DbContext(options)
{
    public static string DatabasePath { get; private set; } = "bottleneko.db";
    
    public DbSet<OptionEntity> Options { get; set; }
    public DbSet<ConnectionEntity> Connections { get; set; }
    public DbSet<ChatEntity> Chats { get; set; }
    public DbSet<DiscordChatEntity> DiscordChats { get; set; }
    public DbSet<TelegramChatEntity> TelegramChats { get; set; }
    public DbSet<TwitchChatEntity> TwitchChats { get; set; }
    public DbSet<ChatterEntity> Chatters  { get; set; }
    public DbSet<DiscordChatterEntity> DiscordChatters { get; set; }
    public DbSet<TelegramChatterEntity> TelegramChatters { get; set; }
    public DbSet<TwitchChatterEntity> TwitchChatters { get; set; }
    public DbSet<ChatMessageAttachmentEntity> MessageAttachments { get; set; }
    public DbSet<DiscordChatMessageAttachmentEntity> DiscordMessageAttachments { get; set; }
    public DbSet<TelegramChatMessageAttachmentEntity> TelegramMessageAttachments { get; set; }
    public DbSet<ChatMessageEntity> ChatMessages { get; set; }
    public DbSet<DiscordChatMessageEntity> DiscordChatMessages { get; set; }
    public DbSet<TelegramChatMessageEntity> TelegramChatMessages { get; set; }
    public DbSet<TwitchChatMessageEntity> TwitchChatMessages { get; set; }
    public DbSet<ScriptEntity> Scripts { get; set; }
    public DbSet<UserEntity> Users { get; set; }
    
    public static JsonSerializerOptions JsonSerializerOptions { get; }= new()
    {
        AllowOutOfOrderMetadataProperties = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private static PooledDbContextFactory<NekoDbContext>? _contextFactory = null;

    public static NekoDbContext CreateDesignTimeDbContext(string[] args)
    {
        if (_contextFactory is null)
        {
            if (args.Length == 1)
            {
                DatabasePath = args[0];
            }
            else if (args.Length != 0)
            {
                throw new Exception("Invalid command line arguments");
            }

            var options = new DbContextOptionsBuilder<NekoDbContext>();
            Configure(options);
            _contextFactory = new PooledDbContextFactory<NekoDbContext>(options.Options);
        }

        return _contextFactory.CreateDbContext();
    }

    public static void Initialize(INekoLogger logger, string dbPath)
    {
        DatabasePath = dbPath;

        var options = new DbContextOptionsBuilder<NekoDbContext>();
        Configure(options);
        _contextFactory = new PooledDbContextFactory<NekoDbContext>(options.Options);

        {
            using var db = Get();

            var migrations = db.Database.GetPendingMigrations().ToArray();

            if (migrations.Length > 0)
            {
                logger.LogInfo("Bottleneko.Database", $"{(db.Database.GetAppliedMigrations().Any() ? "Database schema changed" : "Database does not exist")}, need to apply {migrations.Length} migration(s)");
                foreach (var migration in migrations)
                {
                    logger.LogInfo("Bottleneko.Database", $"Applying migration '{migration}'");
                    db.Database.Migrate(migration);
                }
                logger.LogInfo("Bottleneko.Database", "Database is up to date!");
            }
            else
            {
                logger.LogInfo("Bottleneko.Database", "No pending database migrations");
            }
        }
    }

    public static NekoDbContext Get() => _contextFactory?.CreateDbContext() ?? throw new Exception("Database hasn't been initialized yet");

    private static void Configure(DbContextOptionsBuilder options)
    {
        var connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = DatabasePath,
        };
        options
            .UseSqlite(connectionString.ToString())
            //.LogTo(s => System.Diagnostics.Debug.WriteLine(s))
            //.EnableDetailedErrors(true)
            //.EnableSensitiveDataLogging(true)
            .UseSeeding((context, _) =>
            {
                void SetOptionIfNotExists(Option value)
                {
                    try
                    {
                        context.Set<OptionEntity>().Add(new OptionEntity()
                        {
                            Key = value.GetType().Name,
                            Value = value,
                        });
                        context.SaveChanges();
                    }
                    catch (Exception e) when (e.IsDuplicateKeyException())
                    {
                    }
                }

                SetOptionIfNotExists(new OptionSecretKey(RandomNumberGenerator.GetBytes(256)));
                SetOptionIfNotExists(new OptionSetUp(false));
            });
    }

    protected override void OnModelCreating(ModelBuilder model)
    {
        model
            .Entity<OptionEntity>()
            .Property(e => e.Value)
            .HasConversion(new JsonValueConverter<Option>());

        model
            .Entity<ConnectionEntity>()
            .Property(e => e.Extra)
            .HasConversion(new JsonValueConverter<ExtraProtocolData?>());

        model
            .Entity<ConnectionEntity>()
            .Property(e => e.Configuration)
            .HasConversion(new JsonValueConverter<ProtocolConfiguration>());
        
        model
            .Entity<ScriptEntity>()
            .Property(e => e.Code)
            .HasConversion(new JsonValueConverter<ScriptCode>());
        
        foreach (var entityType in model.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType.IsEnum)
                {
                    var type = typeof(EnumToStringConverter<>).MakeGenericType(property.ClrType);
                    var converter = Activator.CreateInstance(type, new ConverterMappingHints()) as ValueConverter;
                    property.SetValueConverter(converter);
                }
            }
        }
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);
        configurationBuilder.Conventions.Add(serviceProvider => new AutoIncludeAttributeConvention(serviceProvider.GetRequiredService<ProviderConventionSetBuilderDependencies>()));
    }
}
