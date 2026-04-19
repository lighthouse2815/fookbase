using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPostMediaTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PostMedia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MediaUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    MediaType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostMedia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostMedia_Post_PostId",
                        column: x => x.PostId,
                        principalTable: "Post",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostMedia_PostId",
                table: "PostMedia",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostMedia_PostId_SortOrder",
                table: "PostMedia",
                columns: new[] { "PostId", "SortOrder" },
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO [PostMedia] ([Id], [PostId], [MediaUrl], [MediaType], [SortOrder], [CreatedAt])
                SELECT
                    NEWID(),
                    source.[PostId],
                    source.[MediaUrl],
                    CASE
                        WHEN source.[NormalizedMediaUrl] LIKE N'%/video/upload/%'
                            OR source.[NormalizedMediaUrl] LIKE N'data:video/%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mp4'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mp4?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.webm'
                            OR source.[NormalizedMediaUrl] LIKE N'%.webm?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.ogg'
                            OR source.[NormalizedMediaUrl] LIKE N'%.ogg?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mov'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mov?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.m4v'
                            OR source.[NormalizedMediaUrl] LIKE N'%.m4v?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.avi'
                            OR source.[NormalizedMediaUrl] LIKE N'%.avi?%'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mkv'
                            OR source.[NormalizedMediaUrl] LIKE N'%.mkv?%'
                        THEN N'VIDEO'
                        ELSE N'IMAGE'
                    END,
                    source.[SortOrder],
                    source.[CreatedAt]
                FROM
                (
                    SELECT
                        p.[Id] AS [PostId],
                        LTRIM(RTRIM(CAST(j.[value] AS nvarchar(2000)))) AS [MediaUrl],
                        LOWER(LTRIM(RTRIM(CAST(j.[value] AS nvarchar(2000))))) AS [NormalizedMediaUrl],
                        COALESCE(TRY_CAST(j.[key] AS int), 0) AS [SortOrder],
                        COALESCE(p.[UpdatedAt], p.[CreatedAt], SYSUTCDATETIME()) AS [CreatedAt]
                    FROM [Post] AS p
                    CROSS APPLY OPENJSON(p.[ImageUrl]) AS j
                    WHERE p.[ImageUrl] IS NOT NULL
                        AND ISJSON(p.[ImageUrl]) = 1
                
                    UNION ALL
                
                    SELECT
                        p.[Id] AS [PostId],
                        LTRIM(RTRIM(p.[ImageUrl])) AS [MediaUrl],
                        LOWER(LTRIM(RTRIM(p.[ImageUrl]))) AS [NormalizedMediaUrl],
                        0 AS [SortOrder],
                        COALESCE(p.[UpdatedAt], p.[CreatedAt], SYSUTCDATETIME()) AS [CreatedAt]
                    FROM [Post] AS p
                    WHERE p.[ImageUrl] IS NOT NULL
                        AND LTRIM(RTRIM(p.[ImageUrl])) <> N''
                        AND ISJSON(p.[ImageUrl]) <> 1
                ) AS source
                WHERE source.[MediaUrl] <> N''
                    AND NOT EXISTS
                    (
                        SELECT 1
                        FROM [PostMedia] AS pm
                        WHERE pm.[PostId] = source.[PostId]
                            AND pm.[SortOrder] = source.[SortOrder]
                    );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostMedia");
        }
    }
}
