using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPostVisibilityScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Visibility",
                table: "Post",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "PUBLIC");

            migrationBuilder.CreateIndex(
                name: "IX_Post_Visibility",
                table: "Post",
                column: "Visibility");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Post_Visibility",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "Visibility",
                table: "Post");
        }
    }
}
