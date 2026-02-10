using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bottleneko.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddExtraChatterInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TwitchName",
                table: "TwitchChatters");

            migrationBuilder.AddColumn<bool>(
                name: "AddedToAttachmentMenu",
                table: "TelegramChatters",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "TelegramChatters",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HasPremium",
                table: "TelegramChatters",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LanguageCode",
                table: "TelegramChatters",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "TelegramChatters",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Discriminator",
                table: "DiscordChatters",
                type: "TEXT",
                nullable: true);
            
            migrationBuilder.Sql(@"
                UPDATE [TelegramChatters]
                SET
                    FirstName = [Chatters].DisplayName
                FROM [Chatters]
                WHERE
                    [TelegramChatters].ChatterId = [Chatters].Id
            ");

            migrationBuilder.AddColumn<string>(
                name: "CustomAuthorName",
                table: "ChatMessages",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddedToAttachmentMenu",
                table: "TelegramChatters");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "TelegramChatters");

            migrationBuilder.DropColumn(
                name: "HasPremium",
                table: "TelegramChatters");

            migrationBuilder.DropColumn(
                name: "LanguageCode",
                table: "TelegramChatters");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "TelegramChatters");

            migrationBuilder.DropColumn(
                name: "Discriminator",
                table: "DiscordChatters");

            migrationBuilder.DropColumn(
                name: "CustomAuthorName",
                table: "ChatMessages");

            migrationBuilder.AddColumn<string>(
                name: "TwitchName",
                table: "TwitchChatters",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
