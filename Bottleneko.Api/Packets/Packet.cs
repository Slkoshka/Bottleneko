using System.Text.Json.Serialization;
using Bottleneko.Api.Rpc;

namespace Bottleneko.Api.Packets;

[JsonDerivedType(typeof(AuthenticatePacket), typeDiscriminator: "Authenticate")]
[JsonDerivedType(typeof(SubscribePacket), typeDiscriminator: "Subscribe")]
[JsonDerivedType(typeof(MailPacket), typeDiscriminator: "Mail")]
[JsonDerivedType(typeof(UnsubscribePacket), typeDiscriminator: "Unsubscribe")]
[JsonDerivedType(typeof(RequestPacket), typeDiscriminator: "Request")]
[JsonDerivedType(typeof(ResponsePacket), typeDiscriminator: "Response")]
public abstract record Packet();
