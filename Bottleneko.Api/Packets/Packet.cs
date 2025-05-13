using System.Text.Json.Serialization;

namespace Bottleneko.Api.Packets;

[JsonDerivedType(typeof(AuthenticatePacket), typeDiscriminator: "Authenticate")]
[JsonDerivedType(typeof(SubscribePacket), typeDiscriminator: "Subscribe")]
[JsonDerivedType(typeof(MailPacket), typeDiscriminator: "Mail")]
[JsonDerivedType(typeof(UnsubscribePacket), typeDiscriminator: "Unsubscribe")]
public abstract record Packet();
