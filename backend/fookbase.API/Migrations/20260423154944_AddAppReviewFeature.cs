using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAppReviewFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppReview",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppReview", x => x.Id);
                    table.CheckConstraint("CK_AppReview_Rating", "[Rating] >= 1 AND [Rating] <= 5");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppReview_CreatedAt",
                table: "AppReview",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AppReview_IsHidden",
                table: "AppReview",
                column: "IsHidden");

            migrationBuilder.CreateIndex(
                name: "IX_AppReview_Rating",
                table: "AppReview",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_AppReview_UserId",
                table: "AppReview",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppReview");
        }
    }
}
