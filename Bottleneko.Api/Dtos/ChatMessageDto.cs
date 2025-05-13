namespace Bottleneko.Api.Dtos;

public record AttachmentDto(string Id, string? Name, string ContentType);
public record ChatterSummaryDto(string Id, string Name);
public record ChatSummaryDto(string Id, string Name);

public record ChatMessageDto(
    string Id,
    string ConnectionId,
    DateTime Timestamp,
    ChatSummaryDto Chat,
    ChatterSummaryDto Author,
    string? TextContent,
    AttachmentDto[] Attachments,
    bool IsSpecial,
    bool IsDirect,
    bool IsMissed);
