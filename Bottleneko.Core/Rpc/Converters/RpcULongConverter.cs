using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bottleneko.Rpc.Converters;

public class RpcULongConverter : JsonConverter<ulong>
{
    public override ulong Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return ulong.Parse(reader.GetString() ?? throw new JsonException("Value cannot be null"), CultureInfo.InvariantCulture);
    }

    public override void Write(Utf8JsonWriter writer, ulong value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(CultureInfo.InvariantCulture));
    }
}
