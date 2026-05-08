using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class ExtendNotificationForStoryAndTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Notification"
                SET "UpdatedAt" = COALESCE("UpdatedAt", "CreatedAt", NOW())
                WHERE "UpdatedAt" IS NULL;
                """);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Notification",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StoryId",
                table: "Notification",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notification_StoryId",
                table: "Notification",
                column: "StoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Story_StoryId",
                table: "Notification",
                column: "StoryId",
                principalTable: "Story",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notification_Story_StoryId",
                table: "Notification");

            migrationBuilder.DropIndex(
                name: "IX_Notification_StoryId",
                table: "Notification");

            migrationBuilder.DropColumn(
                name: "StoryId",
                table: "Notification");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Notification",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");
        }
    }
}
