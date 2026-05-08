using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class EnforceAdminAuditLogRequiredFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "AdminAuditLog"
                SET "TargetUserId" = "AdminUserId"
                WHERE "TargetUserId" IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE "AdminAuditLog"
                SET "EntityId" = "Id"
                WHERE "EntityId" IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE "AdminAuditLog"
                SET "Details" = 'SYSTEM_BACKFILL_DETAILS'
                WHERE "Details" IS NULL OR btrim("Details") = '';
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "TargetUserId",
                table: "AdminAuditLog",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "EntityId",
                table: "AdminAuditLog",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Details",
                table: "AdminAuditLog",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "TargetUserId",
                table: "AdminAuditLog",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "EntityId",
                table: "AdminAuditLog",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "Details",
                table: "AdminAuditLog",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);
        }
    }
}
