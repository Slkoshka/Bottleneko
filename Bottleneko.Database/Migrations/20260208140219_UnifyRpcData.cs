using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bottleneko.Database.Migrations
{
    /// <inheritdoc />
    public partial class UnifyRpcData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChannelPointsCustomRewardId",
                table: "TwitchChatMessages",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CheerBits",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBroadcaster",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsModerator",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsStaff",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSubscriber",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVip",
                table: "TwitchChatMessages",
                type: "INTEGER",
                nullable: true);
            
            migrationBuilder.Sql("UPDATE [TwitchChatMessages] SET [IsBroadcaster] = 0, [IsStaff] = 0, [IsModerator] = 0, [IsSubscriber] = 0, [IsVip] = 0 WHERE [IsWhisper] = 0;");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "DiscordMessageAttachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProxyUrl",
                table: "DiscordMessageAttachments",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "DiscordMessageAttachments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "DiscordMessageAttachments",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ChannelMentions",
                table: "DiscordChatMessages",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<bool>(
                name: "IsEveryoneMentioned",
                table: "DiscordChatMessages",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "DiscordChatMessages",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RoleMentions",
                table: "DiscordChatMessages",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "UserMentions",
                table: "DiscordChatMessages",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.CreateTable(
                name: "TwitchChatBadgeEntity",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TwitchChatMessageId = table.Column<long>(type: "INTEGER", nullable: false),
                    TwitchId = table.Column<string>(type: "TEXT", nullable: false),
                    Info = table.Column<string>(type: "TEXT", nullable: false),
                    TwitchSetId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwitchChatBadgeEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwitchChatBadgeEntity_TwitchChatMessages_TwitchChatMessageId",
                        column: x => x.TwitchChatMessageId,
                        principalTable: "TwitchChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TwitchChatBadgeEntity_TwitchChatMessageId",
                table: "TwitchChatBadgeEntity",
                column: "TwitchChatMessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TwitchChatBadgeEntity");

            migrationBuilder.DropColumn(
                name: "ChannelPointsCustomRewardId",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "CheerBits",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "IsBroadcaster",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "IsModerator",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "IsStaff",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "IsSubscriber",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "IsVip",
                table: "TwitchChatMessages");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "DiscordMessageAttachments");

            migrationBuilder.DropColumn(
                name: "ProxyUrl",
                table: "DiscordMessageAttachments");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "DiscordMessageAttachments");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "DiscordMessageAttachments");

            migrationBuilder.DropColumn(
                name: "ChannelMentions",
                table: "DiscordChatMessages");

            migrationBuilder.DropColumn(
                name: "IsEveryoneMentioned",
                table: "DiscordChatMessages");

            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "DiscordChatMessages");

            migrationBuilder.DropColumn(
                name: "RoleMentions",
                table: "DiscordChatMessages");

            migrationBuilder.DropColumn(
                name: "UserMentions",
                table: "DiscordChatMessages");
        }
    }
}
