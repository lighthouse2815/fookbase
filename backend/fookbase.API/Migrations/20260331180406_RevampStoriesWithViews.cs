using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class RevampStoriesWithViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Story_ExpiresAt",
                table: "Story");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Story");

            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                table: "Story",
                newName: "ExpiredAt");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Story");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Story",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Story",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MediaType",
                table: "Story",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "IMAGE");

            migrationBuilder.Sql("UPDATE [Story] SET [MediaType] = 'IMAGE' WHERE [MediaType] = '';");

            migrationBuilder.CreateTable(
                name: "StoryView",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ViewerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoryView", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoryView_Story_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Story",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Story_ExpiredAt",
                table: "Story",
                column: "ExpiredAt");

            migrationBuilder.CreateIndex(
                name: "IX_StoryView_StoryId",
                table: "StoryView",
                column: "StoryId");

            migrationBuilder.CreateIndex(
                name: "IX_StoryView_StoryId_ViewerId",
                table: "StoryView",
                columns: new[] { "StoryId", "ViewerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoryView_ViewerId",
                table: "StoryView",
                column: "ViewerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StoryView");

            migrationBuilder.DropIndex(
                name: "IX_Story_ExpiredAt",
                table: "Story");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Story");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Story");

            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "Story");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Story",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Story",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.RenameColumn(
                name: "ExpiredAt",
                table: "Story",
                newName: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Story_ExpiresAt",
                table: "Story",
                column: "ExpiresAt");
        }
    }
}
