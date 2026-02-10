using System.Text.Json.Serialization;
using Bottleneko.Api.Dtos;

namespace Bottleneko.Api.Rpc
{
    [JsonDerivedType(typeof(ChatMessageLetter), typeDiscriminator: "ChatMessage")]
    partial record Letter;
    public record ChatMessageLetter(ChatMessageDto Content) : Letter;

    public record ChatMessageFilter(Protocol? Protocol, string? ConnectionId);
}

namespace Bottleneko.Api.Rpc.Services
{
    [RpcService(RpcService.Messages)]
    public partial interface IMessagesService : IRpcService
    {
        Task<SubscriptionId> SubscribeAsync(IRpcContext context, ChatMessageFilter filter);
        void Unsubscribe(IRpcContext context, SubscriptionId subscriptionId);
        Task SendTextAsync(IRpcContext context, long connectionId, long chatId, string text, long? replyToMessageId);
    }
}
