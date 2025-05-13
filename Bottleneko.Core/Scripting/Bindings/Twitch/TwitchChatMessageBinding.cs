using System.Diagnostics.CodeAnalysis;
using TwitchLib.EventSub.Core.Models.Chat;
using TwitchLib.EventSub.Core.SubscriptionTypes.Channel;
using TwitchLib.EventSub.Core.SubscriptionTypes.User;

namespace Bottleneko.Scripting.Bindings.Twitch;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TwitchChatBadgeBinding
{
    internal TwitchChatBadgeBinding(ChatBadge badge)
    {
        Badge = badge;
    }

    public string id => Badge.Id;
    public string info => Badge.Info;
    public string setId => Badge.SetId;

    internal ChatBadge Badge { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TwitchChatMessageBinding : RawChatMessageBinding
{
    internal TwitchChatMessageBinding(ChannelChatMessage msg)
    {
        Message = msg;
    }

    internal TwitchChatMessageBinding(UserWhisperMessage msg)
    {
        Message = msg;
    }

    public string id => Message switch { ChannelChatMessage channelMsg => channelMsg.MessageId, UserWhisperMessage whisperMsg => whisperMsg.WhisperId, _ => throw new Exception() };
    public string text => Message switch { ChannelChatMessage channelMsg => channelMsg.Message.Text, UserWhisperMessage whisperMsg => whisperMsg.Whisper.Text, _ => throw new Exception() };
    public TwitchChatBadgeBinding[] badges => Message switch { ChannelChatMessage channelMsg => [..channelMsg.Badges.Select(badge => new TwitchChatBadgeBinding(badge))], UserWhisperMessage => [], _ => throw new Exception() };
    public string? color => Message switch { ChannelChatMessage channelMsg => channelMsg.Color, UserWhisperMessage => null, _ => throw new Exception() };
    public int? cheerBits => Message switch { ChannelChatMessage channelMsg => channelMsg.Cheer?.Bits, UserWhisperMessage => null, _ => throw new Exception() };
    public string? channelPointsCustomRewardId => Message switch { ChannelChatMessage channelMsg => channelMsg.ChannelPointsCustomRewardId, UserWhisperMessage => null, _ => throw new Exception() };
    public bool? isSubscriber => Message switch { ChannelChatMessage channelMsg => channelMsg.IsSubscriber, UserWhisperMessage => null, _ => throw new Exception() };
    public bool? isModerator => Message switch { ChannelChatMessage channelMsg => channelMsg.IsModerator, UserWhisperMessage => null, _ => throw new Exception() };
    public bool? isBroadcaster => Message switch { ChannelChatMessage channelMsg => channelMsg.IsBroadcaster, UserWhisperMessage => null, _ => throw new Exception() };
    public bool? isVip => Message switch { ChannelChatMessage channelMsg => channelMsg.IsVip, UserWhisperMessage => null, _ => throw new Exception() };
    public bool? isStaff => Message switch { ChannelChatMessage channelMsg => channelMsg.IsStaff, UserWhisperMessage => null, _ => throw new Exception() };

    internal object Message { get; }
}
