using Bottleneko.Api.Dtos;
using Bottleneko.Api.Rpc;
using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Bottleneko.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using System.Runtime.InteropServices;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class SystemController(IHostApplicationLifetime appLifetime, NekoDbContext db) : NekoController
{
    private static long _startTime = 0;

    public static void Startup()
    {
        _startTime = Environment.TickCount64;
    }


    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        return Ok(new EnvironmentInfoDto(
                new SystemInfoDto(
                    Environment.MachineName,
                    Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true" ? "Container" : RuntimeInformation.OSDescription,
                    RuntimeInformation.ProcessArchitecture switch
                    {
                        Architecture.X86 => "x86",
                        Architecture.X64 => "x86-64",
                        Architecture.Arm => "ARM",
                        Architecture.Arm64 => "ARM64",
                        Architecture.Wasm => "WebAssembly",
                        Architecture.S390x => "IBM S/390",
                        Architecture.LoongArch64 => "LoongArch64",
                        Architecture.Armv6 => "ARMv6",
                        Architecture.Ppc64le => "PowerPC 64-bit Little Endian",
                        Architecture.RiscV64 => "RISC-V 64-bit",

                        _ => RuntimeInformation.ProcessArchitecture.ToString(),
                    },
                    Environment.Version.ToString(),
                    DateTime.UtcNow,
                    Environment.TickCount64 / 1000.0),
                new NekoInfoDto(
                    Assembly.GetExecutingAssembly().GetHumanReadableVersion(),
                    (Environment.TickCount64 - _startTime) / 1000.0
                    )
                )
            );
    }

    [HttpGet("stats/last_year")]
    public async Task<IActionResult> GetMessageStatsLastYearAsync()
    {
        var now = DateTime.UtcNow;
        int[] months = [.. Enumerable.Range(-11, 12).Select(i => new DateTime(now.Year, now.Month, 1, 0, 0, 0, 0, DateTimeKind.Utc).AddMonths(i)).Select(date => date.Year * 100 + date.Month)];

        var messageGroups = await db.ChatMessages
            .GroupBy(msg => new
            {
                msg.RemoteTimestamp.Year,
                msg.RemoteTimestamp.Month,
            })
            .Where(group => months.Contains(group.Key.Year * 100 + group.Key.Month))
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                Count = group.Count(),
            })
            .OrderBy(group => group.Year)
            .ThenBy(group => group.Month)
            .AsAsyncEnumerable()
            .ToDictionaryAsync(group => group.Year * 100 + group.Month, group => new ActivityStatsItemDto($"{group.Year}-{group.Month:D2}", group.Count, group.Count / (float)TimeSpan.FromDays(DateTime.DaysInMonth(group.Year, group.Month)).TotalMinutes));

        return Ok(new ActivityStatsDto([.. months.Select(month =>
        {
            if (messageGroups.TryGetValue(month, out var stats))
            {
                return stats;
            }
            else
            {
                return new ActivityStatsItemDto($"{month / 100}-{month % 100:D2}", 0, 0);
            }
        })]));
    }

    [HttpGet("stats/last_month")]
    public async Task<IActionResult> GetStatsLastMonthAsync()
    {
        var now = DateTime.UtcNow;
        int[] days = [.. Enumerable.Range(-29, 30).Select(i => new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, 0, DateTimeKind.Utc).AddDays(i)).Select(date => date.Year * 100_00 + date.Month * 100 + date.Day)];

        var messageGroups = await db.ChatMessages
            .GroupBy(msg => new
            {
                msg.RemoteTimestamp.Year,
                msg.RemoteTimestamp.Month,
                msg.RemoteTimestamp.Day,
            })
            .Where(group => days.Contains(group.Key.Year * 100_00 + group.Key.Month * 100 + group.Key.Day))
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                group.Key.Day,
                Count = group.Count(),
            })
            .OrderBy(group => group.Year)
            .ThenBy(group => group.Month)
            .ThenBy(group => group.Day)
            .AsAsyncEnumerable()
            .ToDictionaryAsync(group => group.Year * 100_00 + group.Month * 100 + group.Day, group => new ActivityStatsItemDto($"{group.Year}-{group.Month:D2}-{group.Day:D2}", group.Count, group.Count / (float)TimeSpan.FromDays(1.0).TotalMinutes));

        return Ok(new ActivityStatsDto([.. days.Select(day =>
        {
            if (messageGroups.TryGetValue(day, out var stats))
            {
                return stats;
            }
            else
            {
                return new ActivityStatsItemDto($"{day / 100_00}-{day / 100 % 100:D2}-{day % 100:D2}", 0, 0);
            }
        })]));
    }

    [HttpGet("stats/last_day")]
    public async Task<IActionResult> GetStatsLastDayAsync()
    {
        var now = DateTime.UtcNow;
        int[] hours = [.. Enumerable.Range(-23, 24).Select(i => new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, 0, DateTimeKind.Utc).AddHours(i)).Select(date => date.Year * 12 * 31 * 24 + date.Month * 31 * 24 + date.Day * 24 + date.Hour)];

        var messageGroups = await db.ChatMessages
            .GroupBy(msg => new
            {
                msg.RemoteTimestamp.Year,
                msg.RemoteTimestamp.Month,
                msg.RemoteTimestamp.Day,
                msg.RemoteTimestamp.Hour,
            })
            .Where(group => hours.Contains(group.Key.Year * 12 * 31 * 24 + group.Key.Month * 31 * 24 + group.Key.Day * 24 + group.Key.Hour))
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                group.Key.Day,
                group.Key.Hour,
                Count = group.Count(),
            })
            .OrderBy(group => group.Year)
            .ThenBy(group => group.Month)
            .ThenBy(group => group.Day)
            .ThenBy(group => group.Hour)
            .AsAsyncEnumerable()
            .ToDictionaryAsync(group => group.Year * 12 * 31 * 24 + group.Month * 31 * 24 + group.Day * 24 + group.Hour, group => new ActivityStatsItemDto($"{group.Hour:D2}:00", group.Count, group.Count / (float)TimeSpan.FromHours(1.0).TotalMinutes));

        return Ok(new ActivityStatsDto([.. hours.Select(hour =>
        {
            if (messageGroups.TryGetValue(hour, out var stats))
            {
                return stats;
            }
            else
            {
                return new ActivityStatsItemDto($"{hour % 24:D2}:00", 0, 0);
            }
        })]));
    }

    [HttpGet("stats/last_hour")]
    public async Task<IActionResult> GetStatsLastHourAsync()
    {
        var now = DateTime.UtcNow;
        int[] minutes = [.. Enumerable.Range(-59, 60).Select(i => new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0, 0, DateTimeKind.Utc).AddMinutes(i)).Select(date => date.Year * 12 * 31 * 24 * 60 + date.Month * 31 * 24 * 60 + date.Day * 24 * 60 + date.Hour * 60 + date.Minute)];

        var messageGroups = await db.ChatMessages
            .GroupBy(msg => new
            {
                msg.RemoteTimestamp.Year,
                msg.RemoteTimestamp.Month,
                msg.RemoteTimestamp.Day,
                msg.RemoteTimestamp.Hour,
                msg.RemoteTimestamp.Minute,
            })
            .Where(group => minutes.Contains(group.Key.Year * 12 * 31 * 24 * 60 + group.Key.Month * 31 * 24 * 60 + group.Key.Day * 24 * 60 + group.Key.Hour * 60 + group.Key.Minute))
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                group.Key.Day,
                group.Key.Hour,
                group.Key.Minute,
                Count = group.Count(),
            })
            .OrderBy(group => group.Year)
            .ThenBy(group => group.Month)
            .ThenBy(group => group.Day)
            .ThenBy(group => group.Hour)
            .ThenBy(group => group.Minute)
            .AsAsyncEnumerable()
            .ToDictionaryAsync(group => group.Year * 12 * 31 * 24 * 60 + group.Month * 31 * 24 * 60 + group.Day * 24 * 60 + group.Hour * 60 + group.Minute, group => new ActivityStatsItemDto($"{group.Hour:D2}:{group.Minute:D2}", group.Count, group.Count));

        return Ok(new ActivityStatsDto([.. minutes.Select(minute =>
        {
            if (messageGroups.TryGetValue(minute, out var stats))
            {
                return stats;
            }
            else
            {
                return new ActivityStatsItemDto($"{minute / 60 % 24:D2}:{minute % 60:D2}", 0, 0);
            }
        })]));
    }

    [HttpPost("shutdown")]
    public IActionResult Shutdown()
    {
        appLifetime.StopApplication();

        return Ok();
    }

    public record SetupRequest(string Username, string Password);

    [HttpPost("setup")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupAsync([FromBody] SetupRequest request)
    {
        var isSetUp = NekoOptions.GetOptionOrDefault<OptionSetUp>().IsSetUp;
        if (isSetUp)
        {
            return Error(ErrorCode.InvalidOperation, "Server is already configured");
        }
        else
        {
            await db.Users.AddAsync(UserEntity.Create(request.Username, request.Password, UserRole.Administrator));
            await NekoOptions.SetOptionAsync(new OptionSetUp(true));
            await db.SaveChangesAsync();

            return Ok(new Success());
        }
    }
}
