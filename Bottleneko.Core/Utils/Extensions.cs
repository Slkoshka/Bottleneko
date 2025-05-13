using System.Reflection;

namespace Bottleneko.Utils;

public static class Extensions
{
    // Based on https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/interop-with-other-asynchronous-patterns-and-types#tasks-and-wait-handles
    public static Task WaitOneAsync(this WaitHandle waitHandle)
    {
        ArgumentNullException.ThrowIfNull(waitHandle);
        var tcs = new TaskCompletionSource<bool>();
        var rwh = ThreadPool.RegisterWaitForSingleObject(waitHandle, delegate { tcs.TrySetResult(true); }, null, -1, true);
        var t = tcs.Task;
        return t.ContinueWith((antecedent) => rwh.Unregister(null), TaskScheduler.Current);
    }

    public static string GetHumanReadableVersion(this Assembly assembly) => assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? assembly.GetName().Version?.ToString() ?? "Unknown";
}
