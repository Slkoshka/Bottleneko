using Bottleneko.Api.Packets;
using Bottleneko.Utils;

namespace Bottleneko.Logging;

public class LogMessageHistoryFilter(LogFilter filter) : IHistoryFilter<LogMessageEvent>
{
    public bool Matches(LogMessageEvent log)
    {
        if (filter.Severities is not null && filter.Severities.Length != 0 && !filter.Severities.Contains(log.Severity))
        {
            return false;
        }

        if (filter.SourceType is not null && filter.SourceType != log.SourceType)
        {
            return false;
        }

        if (filter.SourceId is not null && filter.SourceId != log.SourceId)
        {
            return false;
        }

        if (filter.Category is not null && filter.Category != log.Category)
        {
            return false;
        }

        return true;
    }
}

public class LogBuffer(int capacity) : HistoryBuffer<LogMessageEvent, LogMessageHistoryFilter>(capacity)
{
}
