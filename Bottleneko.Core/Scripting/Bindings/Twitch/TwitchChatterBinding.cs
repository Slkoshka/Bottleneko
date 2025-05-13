using System.Diagnostics.CodeAnalysis;
using TwitchLib.EventSub.Core.SubscriptionTypes.Channel;
using TwitchLib.EventSub.Core.SubscriptionTypes.User;

namespace Bottleneko.Scripting.Bindings.Twitch;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TwitchChatterBinding : RawChatterBinding
{
    internal TwitchChatterBinding(ChannelChatMessage msg)
    {
        Message = msg;
    }

    internal TwitchChatterBinding(UserWhisperMessage msg)
    {
        Message = msg;
    }

    public string id => Message switch { ChannelChatMessage channelMsg => channelMsg.ChatterUserId, UserWhisperMessage whisperMsg => whisperMsg.FromUserId, _ => throw new Exception() };
    public string login => Message switch { ChannelChatMessage channelMsg => channelMsg.ChatterUserLogin, UserWhisperMessage whisperMsg => whisperMsg.FromUserLogin, _ => throw new Exception() };
    public string displayName => Message switch { ChannelChatMessage channelMsg => channelMsg.ChatterUserName, UserWhisperMessage whisperMsg => whisperMsg.FromUserName, _ => throw new Exception() };

    internal object Message { get; }
}
