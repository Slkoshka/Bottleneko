using Microsoft.ClearScript.JavaScript;
using System.Numerics;
using System.Text;

namespace Bottleneko.Scripting.Js;

[ExposeToScripts(IsInternal = true)]
public class JsMemoryStream
{
    public long Size => _stream.Length;

    private readonly MemoryStream _stream = new();
    private byte[] _buffer = new byte[1024];

    public JsMemoryStream()
    {
    }

    internal JsMemoryStream(MemoryStream ms)
    {
        _stream = ms;
    }

    public void Write(object value)
    {
        if (value is string str)
        {
            var length = Encoding.UTF8.GetByteCount(str);
            if (length > _buffer.Length)
            {
                _buffer = new byte[length];
            }
            Encoding.UTF8.GetBytes(str, _buffer);
            _stream.Write(_buffer.AsSpan(0, length));
        }
        else if (value is IArrayBuffer buffer)
        {
            if (buffer.Size > int.MaxValue)
            {
                throw new Exception("ArrayBuffer is too big");
            }

            if ((int)buffer.Size > _buffer.Length)
            {
                _buffer = new byte[buffer.Size];
            }
            buffer.ReadBytes(0, buffer.Size, _buffer, 0);
            _stream.Write(_buffer.AsSpan(0, (int)buffer.Size));
        }
        else if (value is JsMemoryStream ms)
        {
            var oldPosition = ms._stream.Position;
            ms._stream.Seek(0, SeekOrigin.Begin);
            ms._stream.CopyTo(_stream);
            ms._stream.Seek(oldPosition, SeekOrigin.Begin);
        }
        else if (value is IDataView dataView)
        {
            if (dataView.Size > int.MaxValue)
            {
                throw new Exception("DataView is too big");
            }

            if ((int)dataView.Size > _buffer.Length)
            {
                _buffer = new byte[dataView.Size];
            }
            dataView.ReadBytes(0, dataView.Size, _buffer, 0);
            _stream.Write(_buffer.AsSpan(0, (int)dataView.Size));
        }
        else if (value is ITypedArray typedArrray)
        {
            if (typedArrray.Size > int.MaxValue)
            {
                throw new Exception("TypedArray is too big");
            }

            if ((int)typedArrray.Size > _buffer.Length)
            {
                _buffer = new byte[typedArrray.Size];
            }
            typedArrray.ReadBytes(0, typedArrray.Size, _buffer, 0);
            _stream.Write(_buffer.AsSpan(0, (int)typedArrray.Size));
        }
        else if (value is byte[] bytes)
        {
            _stream.Write(bytes);
        }
        else
        {
            throw new Exception("Unsupported argument type");
        }
    }

    public void ReadToArrayBuffer(IArrayBuffer buffer, BigInteger sourceStart, BigInteger destStart, BigInteger length)
    {
        var position = _stream.Position;
        _stream.Position = (long)sourceStart;
        while (_stream.Position < sourceStart + length)
        {
            var currentSrcPosition = _stream.Position;
            var currentDestPosition = _stream.Position - sourceStart + destStart;
            var chunkSize = (int)Math.Min(_buffer.Length, (long)(sourceStart + length - _stream.Position));
            _stream.ReadExactly(_buffer, 0, chunkSize);
            buffer.WriteBytes(_buffer, (ulong)currentSrcPosition, (ulong)chunkSize, (ulong)currentDestPosition);
        }
        _stream.Position = position;
    }

    public string ReadAsText()
    {
        var position = _stream.Position;
        var sr = new StreamReader(_stream, Encoding.UTF8);
        var result = sr.ReadToEnd();
        _stream.Position = position;
        return result;
    }

    internal byte[] AsByteArray()
    {
        return _stream.ToArray();
    }
}
