using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fookbase.API.Migrations
{
    /// <inheritdoc />
    public partial class SplitCommentReportsFromPostReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommentReport",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_CommentReport", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommentReport_Comment_CommentId",
                        column: x => x.CommentId,
                        principalTable: "Comment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommentReport_CommentId",
                table: "CommentReport",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReport_PostId",
                table: "CommentReport",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReport_ReportedByUserId",
                table: "CommentReport",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReport_Status",
                table: "CommentReport",
                column: "Status");

            migrationBuilder.Sql(
                """
                WITH ParsedCommentReports AS (
                    SELECT
                        PostReport.Id,
                        PostReport.PostId,
                        PostReport.ReportedByUserId,
                        PostReport.Reason,
                        PostReport.Status,
                        PostReport.ResolvedByUserId,
                        PostReport.ResolvedAt,
                        PostReport.CreatedAt,
                        PostReport.UpdatedAt,
                        PostReport.DeletedAt,
                        CHARINDEX(']', PostReport.Reason) AS ClosingBracketIndex,
                        TRY_CONVERT(
                            uniqueidentifier,
                            SUBSTRING(
                                PostReport.Reason,
                                10,
                                CASE
                                    WHEN CHARINDEX(']', PostReport.Reason) > 10 THEN CHARINDEX(']', PostReport.Reason) - 10
                                    ELSE 0
                                END
                            )
                        ) AS ParsedCommentId
                    FROM PostReport
                    WHERE UPPER(PostReport.Reason) LIKE '[[]COMMENT:%'
                ),
                NormalizedCommentReports AS (
                    SELECT
                        Parsed.Id,
                        Parsed.PostId,
                        Parsed.ReportedByUserId,
                        Parsed.ParsedCommentId AS CommentId,
                        CASE
                            WHEN Parsed.ClosingBracketIndex > 0
                                THEN LTRIM(RTRIM(SUBSTRING(Parsed.Reason, Parsed.ClosingBracketIndex + 1, 500)))
                            ELSE LTRIM(RTRIM(Parsed.Reason))
                        END AS ParsedReason,
                        Parsed.Status,
                        Parsed.ResolvedByUserId,
                        Parsed.ResolvedAt,
                        Parsed.CreatedAt,
                        Parsed.UpdatedAt,
                        Parsed.DeletedAt
                    FROM ParsedCommentReports Parsed
                    WHERE Parsed.ParsedCommentId IS NOT NULL
                )
                INSERT INTO CommentReport (
                    Id,
                    CommentId,
                    PostId,
                    ReportedByUserId,
                    Reason,
                    Status,
                    ResolvedByUserId,
                    ResolvedAt,
                    CreatedAt,
                    UpdatedAt,
                    DeletedAt
                )
                SELECT
                    Normalized.Id,
                    Normalized.CommentId,
                    Normalized.PostId,
                    Normalized.ReportedByUserId,
                    CASE
                        WHEN LEN(Normalized.ParsedReason) = 0 THEN N'Reported comment'
                        ELSE Normalized.ParsedReason
                    END,
                    Normalized.Status,
                    Normalized.ResolvedByUserId,
                    Normalized.ResolvedAt,
                    Normalized.CreatedAt,
                    Normalized.UpdatedAt,
                    Normalized.DeletedAt
                FROM NormalizedCommentReports Normalized
                WHERE EXISTS (
                    SELECT 1
                    FROM [Comment]
                    WHERE [Comment].Id = Normalized.CommentId
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM CommentReport
                    WHERE CommentReport.Id = Normalized.Id
                );

                DELETE PostReport
                FROM PostReport
                INNER JOIN CommentReport ON CommentReport.Id = PostReport.Id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO PostReport (
                    Id,
                    PostId,
                    ReportedByUserId,
                    Reason,
                    Status,
                    ResolvedByUserId,
                    ResolvedAt,
                    CreatedAt,
                    UpdatedAt,
                    DeletedAt
                )
                SELECT
                    CommentReport.Id,
                    CommentReport.PostId,
                    CommentReport.ReportedByUserId,
                    LEFT(CONCAT('[COMMENT:', CONVERT(varchar(36), CommentReport.CommentId), '] ', CommentReport.Reason), 500),
                    CommentReport.Status,
                    CommentReport.ResolvedByUserId,
                    CommentReport.ResolvedAt,
                    CommentReport.CreatedAt,
                    CommentReport.UpdatedAt,
                    CommentReport.DeletedAt
                FROM CommentReport
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM PostReport
                    WHERE PostReport.Id = CommentReport.Id
                );
                """);

            migrationBuilder.DropTable(
                name: "CommentReport");
        }
    }
}
