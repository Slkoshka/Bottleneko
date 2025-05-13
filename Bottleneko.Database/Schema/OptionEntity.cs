using System.ComponentModel.DataAnnotations;
using Bottleneko.Database.Options;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema;

public class OptionEntity
{
    [MaxLength(64)]
    [Key]
    public required string Key { get; set; }
    public required Option Value { get; set; }
}

public static class OptionEntityExtensions
{
    //public static T? GetOption<T>(this DbSet<OptionEntity> options, string? name = null) where T: Option
    //{
    //    return options.SingleOrDefault(option => option.Key == (name ?? typeof(T).Name))?.Value as T;
    //}

    //public static T GetOptionOrDefault<T>(this DbSet<OptionEntity> options, string? name = null) where T : Option, new()
    //{
    //    return options.GetOption<T>() ?? new T();
    //}

    //public static T GetRequiredOption<T>(this DbSet<OptionEntity> options, string? name = null) where T: Option
    //{
    //    return options.GetOption<T>() ?? throw new Exception($"Required option '{typeof(T).Name}' is missing");
    //}

    //public static void SetOption(this DbSet<OptionEntity> options, string? name, Option option)
    //{
    //    options
    //        .Upsert(new OptionEntity()
    //        {
    //            Key = name ?? option.GetType().Name,
    //            Value = option,
    //        })
    //        .On(o => o.Key)
    //        .Run();
    //}

    //public static void SetOption(this DbSet<OptionEntity> options, Option option)
    //{
    //    options.SetOption(null, option);
    //}
}
