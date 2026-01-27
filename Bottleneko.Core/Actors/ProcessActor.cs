using System.Diagnostics;
using Akka.Actor;
using Bottleneko.Messages;

namespace Bottleneko.Actors;

class ProcessActor(IServiceProvider services, IActorRef owner, string path, string workingDirectory, string[] arguments, Dictionary<string, string>? environment) : NekoActor(services)
{
    private Process _process = null!;

    private void OnOutput(IActorRef self, string? line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return;
        }

        owner.Tell(new ProcessMessages.OutputLine(line), self);
    }

    private void OnExited(IActorRef self, int code)
    {
        owner.Tell(new ProcessMessages.ProcessStopped(code), self);
        self.Tell(ControlMessages.Shutdown.Instance);
    }

    public override async Task InitAsync(IActorRef self)
    {
        var startInfo = new ProcessStartInfo(path, arguments)
        {
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
        };

        if (environment is not null)
        {
            foreach (var (key, value) in environment)
            {
                startInfo.Environment.Add(key, value);
            }
        }

        _process = new Process()
        {
            StartInfo = startInfo,
            EnableRaisingEvents = true,
        };

        _process.ErrorDataReceived += (_, e) => OnOutput(self, e.Data);
        _process.OutputDataReceived += (_, e) => OnOutput(self, e.Data);
        _process.Exited += (_, e) => OnExited(self, _process.ExitCode);

        if (!_process.Start())
        {
            owner.Tell(new ProcessMessages.ProcessFailed(new Exception("Failed to start script process")));
            self.Tell(ControlMessages.Shutdown.Instance);
            return;
        }

        _process.BeginOutputReadLine();
        _process.BeginErrorReadLine();
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ControlMessages.Shutdown:
                Context.Stop(Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    protected override void PostStop()
    {
        _process.Kill();
        _process.Dispose();

        base.PostStop();
    }
}
