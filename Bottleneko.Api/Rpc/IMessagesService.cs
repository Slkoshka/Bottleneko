using System.Text.Json.Serialization;
using Bottleneko.Api.Dtos;

namespace Bottleneko.Api.Rpc;

[JsonDerivedType(typeof(ChatMessageLetter), typeDiscriminator: "ChatMessage")]
partial record Letter;
public record ChatMessageLetter(ChatMessageDto Content) : Letter;

public record ChatMessageFilter(string? ConnectionId);

[RpcService(RpcService.Messages)]
public partial interface IMessagesService : IRpcService
{
    Task<SubscriptionId> Subscribe(RpcContext context, ChatMessageFilter filter);
    void Unsubscribe(RpcContext context, SubscriptionId subscriptionId);
}
