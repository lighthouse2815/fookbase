using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260513142000_AddFriendshipReadModelTable")]
    public partial class AddFriendshipReadModelTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "FriendshipReadModel" (
                    "OwnerUserId" uuid NOT NULL,
                    "OtherUserId" uuid NOT NULL,
                    "Status" character varying(30) NOT NULL,
                    "UpdatedAtUtc" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_FriendshipReadModel" PRIMARY KEY ("OwnerUserId", "OtherUserId")
                );
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_FriendshipReadModel_OwnerUserId"
                ON "FriendshipReadModel" ("OwnerUserId");
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_FriendshipReadModel_OtherUserId"
                ON "FriendshipReadModel" ("OtherUserId");
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_FriendshipReadModel_OwnerUserId_Status"
                ON "FriendshipReadModel" ("OwnerUserId", "Status");
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF to_regclass('"UserContactReadModel"') IS NOT NULL THEN
                        INSERT INTO "FriendshipReadModel" ("OwnerUserId", "OtherUserId", "Status", "UpdatedAtUtc")
                        SELECT
                            c."OwnerUserId",
                            c."ContactUserId",
                            CASE
                                WHEN c."IsActive" THEN 'ACCEPTED'
                                ELSE 'REMOVED'
                            END,
                            c."UpdatedAtUtc"
                        FROM "UserContactReadModel" c
                        ON CONFLICT ("OwnerUserId", "OtherUserId") DO UPDATE
                        SET
                            "Status" = EXCLUDED."Status",
                            "UpdatedAtUtc" = GREATEST("FriendshipReadModel"."UpdatedAtUtc", EXCLUDED."UpdatedAtUtc");
                    END IF;
                END $$;
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF to_regclass('"UserBlockRelationReadModel"') IS NOT NULL THEN
                        INSERT INTO "FriendshipReadModel" ("OwnerUserId", "OtherUserId", "Status", "UpdatedAtUtc")
                        SELECT
                            b."OwnerUserId",
                            b."BlockedUserId",
                            CASE
                                WHEN b."IsBlocked" THEN 'BLOCKED'
                                ELSE 'REMOVED'
                            END,
                            b."UpdatedAtUtc"
                        FROM "UserBlockRelationReadModel" b
                        ON CONFLICT ("OwnerUserId", "OtherUserId") DO UPDATE
                        SET
                            "Status" = CASE
                                WHEN EXCLUDED."Status" = 'BLOCKED' THEN 'BLOCKED'
                                ELSE EXCLUDED."Status"
                            END,
                            "UpdatedAtUtc" = GREATEST("FriendshipReadModel"."UpdatedAtUtc", EXCLUDED."UpdatedAtUtc");
                    END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS "FriendshipReadModel";
                """);
        }
    }
}
