using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bottleneko.Rpc.Converters;

public class RpcLongConverter : JsonConverter<long>
{
    public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return long.Parse(reader.GetString() ?? throw new JsonException("Value cannot be null"), CultureInfo.InvariantCulture);
    }

    public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(CultureInfo.InvariantCulture));
    }
}
