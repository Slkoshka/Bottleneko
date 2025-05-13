namespace Bottleneko.Api.Dtos;

public record SystemInfoDto(string Hostname, string OperatingSystem, string Arch, string DotNetVersion, DateTime CurrentTime, double Uptime);

public record NekoInfoDto(string Version, double Uptime);

public record MessageStatsDto(int MessagesInLastMinute, int MessagesInLastHour, int MessagesInLastDay);

public record EnvironmentInfoDto(SystemInfoDto System, NekoInfoDto Neko, MessageStatsDto MessageStats);
