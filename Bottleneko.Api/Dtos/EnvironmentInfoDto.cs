namespace Bottleneko.Api.Dtos;

public record SystemInfoDto(string Hostname, string OperatingSystem, string Arch, string DotNetVersion, DateTime CurrentTime, double Uptime);

public record NekoInfoDto(string Version, double Uptime);

public record EnvironmentInfoDto(SystemInfoDto System, NekoInfoDto Neko);

public record ActivityStatsItemDto(string Period, int TotalMessages, float MessagesPerMinute);
public record ActivityStatsDto(ActivityStatsItemDto[] Items);
