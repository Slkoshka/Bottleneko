using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bottleneko.Server.Utils;

// Based on https://stackoverflow.com/a/59832092
public class SerializePropertyAsDefaultConverter<T> : JsonConverter<T>
{
    public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return JsonSerializer.Deserialize<T>(ref reader);
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, value);
    }
}
