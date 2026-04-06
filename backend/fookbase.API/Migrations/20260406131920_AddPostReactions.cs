using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPostReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Like",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "LIKE");

            migrationBuilder.CreateIndex(
                name: "IX_Like_PostId",
                table: "Like",
                column: "PostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Like_PostId",
                table: "Like");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Like");
        }
    }
}
