using Bottleneko.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Runtime.InteropServices;
using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Bottleneko.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class SystemController(IHostApplicationLifetime appLifetime, NekoDbContext db) : NekoController
{
    private static readonly long _startTime;

    static SystemController()
    {
        _startTime = Environment.TickCount64;
    }


    [HttpGet("info")]
    public async Task<IActionResult> GetInfoAsync()
    {
        var minuteAgo = DateTime.UtcNow - TimeSpan.FromMinutes(1);
        var hourAgo = DateTime.UtcNow - TimeSpan.FromHours(1);
        var dayAgo = DateTime.UtcNow - TimeSpan.FromDays(1);

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
                    ),
                new MessageStatsDto(
                        await db.ChatMessages.CountAsync(m => m.RemoteTimestamp >= minuteAgo),
                        await db.ChatMessages.CountAsync(m => m.RemoteTimestamp >= hourAgo),
                        await db.ChatMessages.CountAsync(m => m.RemoteTimestamp >= dayAgo)
                    )
                )
            );
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
            return Error(ErrorCode.InvalidOperation, "Server already set up");
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
