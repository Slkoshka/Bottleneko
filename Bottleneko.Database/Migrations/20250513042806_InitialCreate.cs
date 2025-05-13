using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bottleneko.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Connections",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Protocol = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    AutoStart = table.Column<bool>(type: "INTEGER", nullable: false),
                    Configuration = table.Column<string>(type: "TEXT", nullable: false),
                    Extra = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Connections", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Options",
                columns: table => new
                {
                    Key = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Options", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "Scripts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    AutoStart = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scripts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Login = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<byte[]>(type: "BLOB", maxLength: 64, nullable: false),
                    Salt = table.Column<byte[]>(type: "BLOB", maxLength: 64, nullable: false),
                    LastLogin = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chats",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    IsPrivate = table.Column<bool>(type: "INTEGER", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chats_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Chatters",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    IsBot = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chatters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chatters_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscordChats",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    DiscordGuildId = table.Column<ulong>(type: "INTEGER", nullable: true),
                    DiscordChannelId = table.Column<ulong>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscordChats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscordChats_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscordChats_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelegramChats",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramId = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramChats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramChats_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TelegramChats_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TwitchChats",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TwitchId = table.Column<string>(type: "TEXT", nullable: false),
                    TwitchName = table.Column<string>(type: "TEXT", nullable: false),
                    IsWhisper = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwitchChats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwitchChats_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TwitchChats_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    RemoteTimestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    AuthorId = table.Column<long>(type: "INTEGER", nullable: false),
                    TextContent = table.Column<string>(type: "TEXT", nullable: true),
                    IsSpecial = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDirect = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsOffline = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReplyToId = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatMessages_ReplyToId",
                        column: x => x.ReplyToId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatMessages_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Chatters_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Chatters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscordChatters",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatterId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    DiscordUserId = table.Column<ulong>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscordChatters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscordChatters_Chatters_ChatterId",
                        column: x => x.ChatterId,
                        principalTable: "Chatters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscordChatters_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelegramChatters",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatterId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramId = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramChatters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramChatters_Chatters_ChatterId",
                        column: x => x.ChatterId,
                        principalTable: "Chatters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TelegramChatters_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TwitchChatters",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatterId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TwitchId = table.Column<string>(type: "TEXT", nullable: false),
                    TwitchName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwitchChatters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwitchChatters_Chatters_ChatterId",
                        column: x => x.ChatterId,
                        principalTable: "Chatters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TwitchChatters_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscordChatMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatMessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    DiscordGuildId = table.Column<ulong>(type: "INTEGER", nullable: true),
                    DiscordChannelId = table.Column<ulong>(type: "INTEGER", nullable: false),
                    DiscordMessageId = table.Column<ulong>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscordChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscordChatMessages_ChatMessages_ChatMessageId",
                        column: x => x.ChatMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscordChatMessages_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MessageAttachments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    MessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: true),
                    Url = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageAttachments_ChatMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MessageAttachments_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelegramChatMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatMessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramMediaGroupId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramChatMessages_ChatMessages_ChatMessageId",
                        column: x => x.ChatMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TelegramChatMessages_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TwitchChatMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatMessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TwitchChatId = table.Column<string>(type: "TEXT", nullable: false),
                    TwitchId = table.Column<string>(type: "TEXT", nullable: false),
                    IsWhisper = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwitchChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwitchChatMessages_ChatMessages_ChatMessageId",
                        column: x => x.ChatMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TwitchChatMessages_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscordMessageAttachments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatMessageAttachmentId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    DiscordGuildId = table.Column<ulong>(type: "INTEGER", nullable: true),
                    DiscordChannelId = table.Column<ulong>(type: "INTEGER", nullable: false),
                    DiscordAttachmentId = table.Column<ulong>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscordMessageAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscordMessageAttachments_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscordMessageAttachments_MessageAttachments_ChatMessageAttachmentId",
                        column: x => x.ChatMessageAttachmentId,
                        principalTable: "MessageAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelegramMessageAttachments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatMessageAttachmentId = table.Column<long>(type: "INTEGER", nullable: false),
                    ConnectionId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramAttachmentType = table.Column<string>(type: "TEXT", nullable: false),
                    TelegramChatId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramMessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    TelegramFileId = table.Column<string>(type: "TEXT", nullable: false),
                    TelegramFileUniqueId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramMessageAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramMessageAttachments_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TelegramMessageAttachments_MessageAttachments_ChatMessageAttachmentId",
                        column: x => x.ChatMessageAttachmentId,
                        principalTable: "MessageAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_AuthorId",
                table: "ChatMessages",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ChatId",
                table: "ChatMessages",
                column: "ChatId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConnectionId",
                table: "ChatMessages",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_RemoteTimestamp",
                table: "ChatMessages",
                column: "RemoteTimestamp",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ReplyToId",
                table: "ChatMessages",
                column: "ReplyToId");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_ConnectionId",
                table: "Chats",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Chatters_ConnectionId",
                table: "Chatters",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChatMessages_ChatMessageId",
                table: "DiscordChatMessages",
                column: "ChatMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChatMessages_ConnectionId_DiscordMessageId_DiscordGuildId_DiscordChannelId",
                table: "DiscordChatMessages",
                columns: new[] { "ConnectionId", "DiscordMessageId", "DiscordGuildId", "DiscordChannelId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChats_ChatId",
                table: "DiscordChats",
                column: "ChatId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChats_ConnectionId_DiscordChannelId_DiscordGuildId",
                table: "DiscordChats",
                columns: new[] { "ConnectionId", "DiscordChannelId", "DiscordGuildId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChatters_ChatterId",
                table: "DiscordChatters",
                column: "ChatterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordChatters_ConnectionId_DiscordUserId",
                table: "DiscordChatters",
                columns: new[] { "ConnectionId", "DiscordUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordMessageAttachments_ChatMessageAttachmentId",
                table: "DiscordMessageAttachments",
                column: "ChatMessageAttachmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscordMessageAttachments_ConnectionId_DiscordAttachmentId",
                table: "DiscordMessageAttachments",
                columns: new[] { "ConnectionId", "DiscordAttachmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MessageAttachments_ConnectionId",
                table: "MessageAttachments",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_MessageAttachments_MessageId",
                table: "MessageAttachments",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChatMessages_ChatMessageId",
                table: "TelegramChatMessages",
                column: "ChatMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChatMessages_ConnectionId_TelegramId_TelegramChatId",
                table: "TelegramChatMessages",
                columns: new[] { "ConnectionId", "TelegramId", "TelegramChatId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChats_ChatId",
                table: "TelegramChats",
                column: "ChatId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChats_ConnectionId_TelegramId",
                table: "TelegramChats",
                columns: new[] { "ConnectionId", "TelegramId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChatters_ChatterId",
                table: "TelegramChatters",
                column: "ChatterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramChatters_ConnectionId_TelegramId",
                table: "TelegramChatters",
                columns: new[] { "ConnectionId", "TelegramId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramMessageAttachments_ChatMessageAttachmentId",
                table: "TelegramMessageAttachments",
                column: "ChatMessageAttachmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramMessageAttachments_ConnectionId_TelegramAttachmentType_TelegramChatId_TelegramMessageId",
                table: "TelegramMessageAttachments",
                columns: new[] { "ConnectionId", "TelegramAttachmentType", "TelegramChatId", "TelegramMessageId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelegramMessageAttachments_ConnectionId_TelegramMessageId_TelegramChatId",
                table: "TelegramMessageAttachments",
                columns: new[] { "ConnectionId", "TelegramMessageId", "TelegramChatId" });

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChatMessages_ChatMessageId",
                table: "TwitchChatMessages",
                column: "ChatMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChatMessages_ConnectionId_TwitchChatId_TwitchId_IsWhisper",
                table: "TwitchChatMessages",
                columns: new[] { "ConnectionId", "TwitchChatId", "TwitchId", "IsWhisper" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChats_ChatId",
                table: "TwitchChats",
                column: "ChatId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChats_ConnectionId_TwitchId_IsWhisper",
                table: "TwitchChats",
                columns: new[] { "ConnectionId", "TwitchId", "IsWhisper" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChatters_ChatterId",
                table: "TwitchChatters",
                column: "ChatterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChatters_ConnectionId_TwitchId",
                table: "TwitchChatters",
                columns: new[] { "ConnectionId", "TwitchId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Login",
                table: "Users",
                column: "Login",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiscordChatMessages");

            migrationBuilder.DropTable(
                name: "DiscordChats");

            migrationBuilder.DropTable(
                name: "DiscordChatters");

            migrationBuilder.DropTable(
                name: "DiscordMessageAttachments");

            migrationBuilder.DropTable(
                name: "Options");

            migrationBuilder.DropTable(
                name: "Scripts");

            migrationBuilder.DropTable(
                name: "TelegramChatMessages");

            migrationBuilder.DropTable(
                name: "TelegramChats");

            migrationBuilder.DropTable(
                name: "TelegramChatters");

            migrationBuilder.DropTable(
                name: "TelegramMessageAttachments");

            migrationBuilder.DropTable(
                name: "TwitchChatMessages");

            migrationBuilder.DropTable(
                name: "TwitchChats");

            migrationBuilder.DropTable(
                name: "TwitchChatters");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "MessageAttachments");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "Chats");

            migrationBuilder.DropTable(
                name: "Chatters");

            migrationBuilder.DropTable(
                name: "Connections");
        }
    }
}
