using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSharedPostSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OriginalPostId",
                table: "Post",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Post_OriginalPostId",
                table: "Post",
                column: "OriginalPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Post_Post_OriginalPostId",
                table: "Post",
                column: "OriginalPostId",
                principalTable: "Post",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Post_Post_OriginalPostId",
                table: "Post");

            migrationBuilder.DropIndex(
                name: "IX_Post_OriginalPostId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "OriginalPostId",
                table: "Post");
        }
    }
}
