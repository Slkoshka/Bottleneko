using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko;

public class NekoOptions
{
    private static Dictionary<string, Option>? _options = null;

    public static void Initialize()
    {
        using var db = NekoDbContext.Get();
        _options = db.Options.ToDictionary(option => option.Key, option => option.Value);
    }

    public static T? GetOption<T>(string? name = null) where T : Option
    {
        _options = _options ?? throw new Exception($"{nameof(NekoOptions)} hasn't been initialized yet");

        return _options.GetValueOrDefault(name ?? typeof(T).Name) as T;
    }

    public static T GetOptionOrDefault<T>(string? name = null) where T : Option, new() => GetOption<T>() ?? new T();

    public static T GetRequiredOption<T>(string? name = null) where T : Option => GetOption<T>() ?? throw new Exception($"Required option '{typeof(T).Name}' is missing");

    public static void SetOption(string? name, Option option)
    {
        _options = _options ?? throw new Exception($"{nameof(NekoOptions)} hasn't been initialized yet");

        name ??= option.GetType().Name;
        using var db = NekoDbContext.Get();
        db.Options
            .Upsert(new OptionEntity()
            {
                Key = name,
                Value = option,
            })
            .On(o => o.Key)
            .Run();
        _options[name] = option;
    }

    public static void SetOption(Option option) => SetOption(null, option);

    public static async Task SetOptionAsync(string? name, Option option)
    {
        _options = _options ?? throw new Exception($"{nameof(NekoOptions)} hasn't been initialized yet");

        name ??= option.GetType().Name;
        await using var db = NekoDbContext.Get();
        await db.Options
            .Upsert(new OptionEntity()
            {
                Key = name,
                Value = option,
            })
            .On(o => o.Key)
            .RunAsync();
        await db.SaveChangesAsync();
        _options[name] = option;
    }

    public static Task SetOptionAsync(Option option) => SetOptionAsync(null, option);
}
