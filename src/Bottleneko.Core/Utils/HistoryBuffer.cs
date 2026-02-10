using System.Diagnostics.CodeAnalysis;

namespace Bottleneko.Utils;

public interface IHistoryFilter<in TItem>
{
    bool Matches(TItem item);
}

public interface IHistoryItem
{
    string Id { get; }
}

public abstract class HistoryBuffer<TItem, TFilter>(int capacity)
    where TItem : IHistoryItem
    where TFilter : IHistoryFilter<TItem>
{
    private readonly Lock _lock = new();
    private readonly CircularBuffer<TItem> _buffer = new(capacity);

    public void Write(TItem message)
    {
        lock (_lock)
        {
            _buffer.PushEnd(message);
        }
    }

    public TItem[] GetAll()
    {
        var result = new TItem[_buffer.Count];
        for (int i = 0; i < result.Length; i++)
        {
            result[i] = _buffer[i];
        }
        return result;
    }

    public bool TryGetLast(TFilter filter, [NotNullWhen(true)] out TItem? result)
    {
        for (var i = _buffer.Count - 1; i >= 0; i--)
        {
            if (filter.Matches(_buffer[i]))
            {
                result = _buffer[i];
                return true;
            }
        }

        result = default;
        return false;
    }

    /// <summary>
    /// Return last N messages (N is the size of target). target[^1] is the latest message
    /// </summary>
    /// <param name="target">Target buffer</param>
    /// <param name="filter">Do not return messages that do not pass this filter</param>
    /// <returns>Number of written messages</returns>
    public int GetLast(Memory<TItem> target, TFilter filter)
    {
        var written = 0;
        var current = _buffer.Count - 1;

        while (written < target.Length && current >= 0)
        {
            if (filter.Matches(_buffer[current]))
            {
                target.Span[^(written + 1)] = _buffer[current];
                written++;
            }

            current--;
        }

        return written;
    }

    /// <summary>
    /// Return N new messages (N is the size of target). target[0] is the oldest message
    /// </summary>
    /// <param name="id">Only return messages newer than this ID. If it is null or does not exist in the internal buffer, this function will return all messages</param>
    /// <param name="target">Target buffer</param>
    /// <param name="filter">Do not return messages that do not pass this filter</param>
    /// <returns>Number of written messages</returns>
    public int GetSince(string? id, Memory<TItem> target, TFilter filter)
    {
        var written = 0;
        var start = 0;
        lock (_lock)
        {
            if (id is not null)
            {
                for (var i = _buffer.Count - 1; i >= 0; i--)
                {
                    if (_buffer[i].Id == id)
                    {
                        start = i + 1;
                        break;
                    }
                }
            }

            var current = start;

            while (written < target.Length && current < _buffer.Count)
            {
                if (filter.Matches(_buffer[current]))
                {
                    target.Span[written] = _buffer[current];
                    written++;
                }

                current++;
            }
        }
        return written;
    }
}
