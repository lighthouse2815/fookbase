using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserReport",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReportedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ResolvedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserReport", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserReport_ReportedByUserId",
                table: "UserReport",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReport_Status",
                table: "UserReport",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_UserReport_TargetUserId",
                table: "UserReport",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserReport");
        }
    }
}
