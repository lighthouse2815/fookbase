using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyHashtagName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Hashtag"
                SET "Name" = CASE
                    WHEN btrim("NormalizedName") <> '' THEN lower(ltrim(btrim("NormalizedName"), '#'))
                    WHEN btrim("Name") <> '' THEN lower(ltrim(btrim("Name"), '#'))
                    ELSE 'tag_' || replace(left("Id"::text, 8), '-', '')
                END;
                """);

            migrationBuilder.Sql("""
                WITH canonical AS (
                    SELECT
                        "Id",
                        "Name",
                        FIRST_VALUE("Id") OVER (
                            PARTITION BY "Name"
                            ORDER BY "Id"
                        ) AS keep_id
                    FROM "Hashtag"
                ),
                mapping AS (
                    SELECT "Id" AS old_id, keep_id
                    FROM canonical
                    WHERE "Id" <> keep_id
                )
                INSERT INTO "PostHashtag" ("PostId", "HashtagId", "CreatedAt", "UpdatedAt", "DeletedAt")
                SELECT ph."PostId", m.keep_id, ph."CreatedAt", ph."UpdatedAt", ph."DeletedAt"
                FROM "PostHashtag" ph
                JOIN mapping m ON m.old_id = ph."HashtagId"
                ON CONFLICT ("PostId", "HashtagId") DO NOTHING;
                """);

            migrationBuilder.Sql("""
                WITH canonical AS (
                    SELECT
                        "Id",
                        "Name",
                        FIRST_VALUE("Id") OVER (
                            PARTITION BY "Name"
                            ORDER BY "Id"
                        ) AS keep_id
                    FROM "Hashtag"
                ),
                mapping AS (
                    SELECT "Id" AS old_id
                    FROM canonical
                    WHERE "Id" <> keep_id
                )
                DELETE FROM "PostHashtag" ph
                USING mapping m
                WHERE ph."HashtagId" = m.old_id;
                """);

            migrationBuilder.Sql("""
                WITH canonical AS (
                    SELECT
                        "Id",
                        "Name",
                        FIRST_VALUE("Id") OVER (
                            PARTITION BY "Name"
                            ORDER BY "Id"
                        ) AS keep_id
                    FROM "Hashtag"
                ),
                mapping AS (
                    SELECT "Id" AS old_id
                    FROM canonical
                    WHERE "Id" <> keep_id
                )
                DELETE FROM "Hashtag" h
                USING mapping m
                WHERE h."Id" = m.old_id;
                """);

            migrationBuilder.Sql("""
                UPDATE "Hashtag"
                SET "UpdatedAt" = COALESCE("UpdatedAt", "CreatedAt", NOW())
                WHERE "UpdatedAt" IS NULL;
                """);

            migrationBuilder.DropIndex(
                name: "IX_Hashtag_NormalizedName",
                table: "Hashtag");

            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "Hashtag");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Hashtag",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Hashtag_Name",
                table: "Hashtag",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Hashtag_Name",
                table: "Hashtag");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Hashtag",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "Hashtag",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Hashtag"
                SET "NormalizedName" = "Name";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Hashtag_NormalizedName",
                table: "Hashtag",
                column: "NormalizedName",
                unique: true);
        }
    }
}
