using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class RenameUserProfileSummaryReadModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserProfileReadModel",
                table: "UserProfileReadModel");

            migrationBuilder.RenameTable(
                name: "UserProfileReadModel",
                newName: "UserProfileSummaryReadModel");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserProfileSummaryReadModel",
                table: "UserProfileSummaryReadModel",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserProfileSummaryReadModel",
                table: "UserProfileSummaryReadModel");

            migrationBuilder.RenameTable(
                name: "UserProfileSummaryReadModel",
                newName: "UserProfileReadModel");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserProfileReadModel",
                table: "UserProfileReadModel",
                column: "UserId");
        }
    }
}
