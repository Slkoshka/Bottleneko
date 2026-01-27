namespace Bottleneko.Messages;

public static class ProcessMessages
{
    public record OutputLine(string Line);
    public record ProcessFailed(Exception Exception);
    public record ProcessStopped(int Code);
}
