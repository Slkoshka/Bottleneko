using System.Diagnostics.CodeAnalysis;
using TwitchLib.EventSub.Core.SubscriptionTypes.Channel;
using TwitchLib.EventSub.Core.SubscriptionTypes.User;

namespace Bottleneko.Scripting.Bindings.Twitch;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TwitchChatBinding : RawChatBinding
{
    internal TwitchChatBinding(ChannelChatMessage msg)
    {
        Message = msg;
    }

    internal TwitchChatBinding(UserWhisperMessage msg)
    {
        Message = msg;
    }

    public string id => Message switch { ChannelChatMessage channelMsg => channelMsg.BroadcasterUserId, UserWhisperMessage whisperMsg => whisperMsg.WhisperId, _ => throw new Exception() };
    public string name => Message switch { ChannelChatMessage channelMsg => channelMsg.BroadcasterUserLogin, UserWhisperMessage whisperMsg => whisperMsg.FromUserLogin, _ => throw new Exception() };
    public string displayName => Message switch { ChannelChatMessage channelMsg => channelMsg.BroadcasterUserName, UserWhisperMessage whisperMsg => whisperMsg.FromUserName, _ => throw new Exception() };
    public bool isWhisper => Message is UserWhisperMessage;

    internal object Message { get; }
}
