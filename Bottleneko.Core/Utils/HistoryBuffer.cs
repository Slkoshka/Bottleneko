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
    where TItem: IHistoryItem
    where TFilter: IHistoryFilter<TItem>
{
    private readonly Lock _lock = new Lock();
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
