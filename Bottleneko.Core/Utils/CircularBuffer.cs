namespace Bottleneko.Utils;

public class CircularBuffer<T>(int capacity)
{
    public int Capacity => _buffer.Length;
    public int Count => _start < _end ? _end - _start : (_start > _end ? _end - _start + Capacity : (_isEmpty ? 0 : Capacity));
    public T this[int index] => _buffer[(_start + index) % Capacity];
    
    private T[] _buffer = new T[capacity];
    private int _start = 0;
    private int _end = 0;
    private bool _isEmpty = true;

    public void PushStart(T item)
    {
        _isEmpty = false;
        _start = (_start - 1 + Capacity) % Capacity;
        if (_end == (_start + 1) % Capacity)
        {
            _end = (_end - 1 + Capacity) % Capacity;
        }
        _buffer[_start] = item;
    }

    public void PushEnd(T item)
    {
        if (!_isEmpty && _end == _start)
        {
            _start = (_start + 1) % Capacity;
        }
        _isEmpty = false;
        _buffer[_end] = item;
        _end = (_end + 1) % Capacity;
    }

    public void Resize(int newSize)
    {
        var newBuffer = new T[newSize];
        var newCount = Math.Min(newSize, Count);
        var reduction = Count - newCount;
        for (var i = 0; i < newCount; i++)
        {
            newBuffer[i] = this[i + reduction];
        }
        
        _buffer = newBuffer;
        _start = 0;
        _end = newCount % newSize;
    }
}
