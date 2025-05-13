using System.Diagnostics.CodeAnalysis;
using System.Numerics;
using Telegram.Bot.Types;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
public class UnknownTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal UnknownTelegramAttachmentExtra()
    {
    }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class AnimationTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal AnimationTelegramAttachmentExtra(Animation animation)
    {
        Animation = animation;
    }

    public int width => Animation.Width;
    public int height => Animation.Height;
    public int duration => Animation.Duration;

    internal Animation Animation { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class AudioTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal AudioTelegramAttachmentExtra(Audio audio)
    {
        Audio = audio;
    }

    public int duration => Audio.Duration;
    public string? performer => Audio.Performer;
    public string? title => Audio.Title;

    internal Audio Audio { get; }
}

[ExposeToScripts]
public class DocumentTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal DocumentTelegramAttachmentExtra(Document document)
    {
        Document = document;
    }

    internal Document Document { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class PhotoTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal PhotoTelegramAttachmentExtra(PhotoSize photo)
    {
        Photo = photo;
    }

    public int width => Photo.Width;
    public int height => Photo.Height;

    internal PhotoSize Photo { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class StickerTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal StickerTelegramAttachmentExtra(Sticker sticker)
    {
        Sticker = sticker;
    }

    public int width => Sticker.Width;
    public int height => Sticker.Height;
    public bool isAnimated => Sticker.IsAnimated;
    public bool isVideo => Sticker.IsVideo;
    public string? emoji => Sticker.Emoji;
    public string? setName => Sticker.SetName;

    internal Sticker Sticker { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class VideoTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal VideoTelegramAttachmentExtra(Video video)
    {
        Video = video;
    }

    public int width => Video.Width;
    public int height => Video.Height;
    public int duration => Video.Duration;
    public int? startTimestamp => Video.StartTimestamp;

    internal Video Video { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class VideoNoteTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal VideoNoteTelegramAttachmentExtra(VideoNote videoNote)
    {
        VideoNote = videoNote;
    }

    public int width => VideoNote.Length;
    public int height => VideoNote.Length;
    public int duration => VideoNote.Duration;

    internal VideoNote VideoNote { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class VoiceTelegramAttachmentExtra : ITelegramAttachmentExtra
{
    internal VoiceTelegramAttachmentExtra(Voice voice)
    {
        Voice = voice;
    }

    public int duration => Voice.Duration;

    internal Voice Voice { get; }
}

[ExposeToScripts(
    typeof(AnimationTelegramAttachmentExtra),
    typeof(AudioTelegramAttachmentExtra),
    typeof(DocumentTelegramAttachmentExtra),
    typeof(PhotoTelegramAttachmentExtra),
    typeof(StickerTelegramAttachmentExtra),
    typeof(VideoTelegramAttachmentExtra),
    typeof(VideoNoteTelegramAttachmentExtra),
    typeof(VoiceTelegramAttachmentExtra),
    typeof(UnknownTelegramAttachmentExtra)
)]
public interface ITelegramAttachmentExtra
{
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TelegramChatMessageAttachmentBinding : RawChatMessageAttachmentBinding
{
    internal TelegramChatMessageAttachmentBinding(FileBase file)
    {
        extra = file switch
        {
            Animation animation => new AnimationTelegramAttachmentExtra(animation),
            Audio audio => new AudioTelegramAttachmentExtra(audio),
            Document document => new DocumentTelegramAttachmentExtra(document),
            PhotoSize photo => new PhotoTelegramAttachmentExtra(photo),
            Sticker sticker => new StickerTelegramAttachmentExtra(sticker),
            Video video => new VideoTelegramAttachmentExtra(video),
            VideoNote videoNote => new VideoNoteTelegramAttachmentExtra(videoNote),
            Voice voice => new VoiceTelegramAttachmentExtra(voice),
            _ => new UnknownTelegramAttachmentExtra(),
        };

        File = file;
    }

    public string fileId => File.FileId;
    public string fileUniqueId => File.FileUniqueId;
    public BigInteger? fileSize => File.FileSize;

    [Microsoft.ClearScript.ScriptMember(Microsoft.ClearScript.ScriptMemberFlags.ExposeRuntimeType)]
    public ITelegramAttachmentExtra extra { get; }

    internal FileBase File { get; }
}
