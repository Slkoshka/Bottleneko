namespace Bottleneko.Helpers;

public static class FileSystem
{
    public static void Delete(string path, bool recursive = false)
    {
        if (File.Exists(path))
        {
            File.Delete(path);
        }
        else if (Directory.Exists(path))
        {
            Directory.Delete(path, recursive);
        }
    }

    public static void CopyFiles(string src, string dest, string pattern, bool recursive = false, Predicate<string>? exclude = null)
    {
        foreach (var file in Directory.GetFiles(src, pattern, new EnumerationOptions() { RecurseSubdirectories = recursive }))
        {
            if (exclude?.Invoke(file) ?? false)
            {
                continue;
            }

            var fullDest = Path.Combine(dest, Path.GetRelativePath(src, file));
            if (Path.GetDirectoryName(fullDest) is string destDir)
            {
                Directory.CreateDirectory(destDir);
                File.Copy(file, fullDest, overwrite: true);
            }
        }
    }

    public static string? FindInPath(string executable)
    {
        string[] dirs;

        if (OperatingSystem.IsWindows())
        {
            if (!executable.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) && !executable.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) && !executable.EndsWith(".bat", StringComparison.OrdinalIgnoreCase))
            {
                return FindInPath($"{executable}.exe") ?? FindInPath($"{executable}.cmd") ?? FindInPath($"{executable}.bat");
            }

            dirs = Environment.GetEnvironmentVariable("PATH")?.Split(';') ?? [];
        }
        else if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS() || OperatingSystem.IsFreeBSD())
        {
            dirs = Environment.GetEnvironmentVariable("PATH")?.Split(':') ?? [];
        }
        else
        {
            throw new PlatformNotSupportedException("Only Windows, MacOS, and Linux are supported");
        }

        return dirs.Select(dir => Path.Combine(dir, executable)).Select(Path.GetFullPath).FirstOrDefault(File.Exists);
    }

    public static string GetDataDirectory(string name)
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData, Environment.SpecialFolderOption.Create), name);
    }
}
