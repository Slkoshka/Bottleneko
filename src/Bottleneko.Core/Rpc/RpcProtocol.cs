using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc.Converters;

namespace Bottleneko.Rpc;

public static class RpcProtocol
{
    private static readonly JsonSerializerOptions _serializerOptions = new()
    {
        AllowOutOfOrderMetadataProperties = true,
        Converters =
        {
            new JsonStringEnumConverter(),
            new RpcTimeSpanConverter(),
            new RpcLongConverter(),
            new RpcULongConverter(),
        },
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static byte[] Serialize(Packet packet)
    {
        return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(packet, _serializerOptions));
    }

    public static Packet? Deserialize(Stream stream)
    {
        return JsonSerializer.Deserialize<Packet>(stream, _serializerOptions);
    }

    public static Packet? Deserialize(ReadOnlySpan<byte> data)
    {
        return JsonSerializer.Deserialize<Packet>(data, _serializerOptions);
    }
}
