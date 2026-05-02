CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "AdminAuditLog" (
    "Id" uuid NOT NULL,
    "AdminUserId" uuid NOT NULL,
    "ActionType" character varying(60) NOT NULL,
    "EntityType" character varying(40) NOT NULL,
    "EntityId" uuid,
    "TargetUserId" uuid,
    "Details" character varying(1000),
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AdminAuditLog" PRIMARY KEY ("Id")
);

CREATE TABLE "AppReview" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "DisplayName" character varying(80) NOT NULL,
    "Rating" integer NOT NULL,
    "Comment" character varying(1000) NOT NULL,
    "IsHidden" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AppReview" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_AppReview_Rating" CHECK ("Rating" >= 1 AND "Rating" <= 5)
);

CREATE TABLE "Hashtag" (
    "Id" uuid NOT NULL,
    "Name" character varying(60) NOT NULL,
    "NormalizedName" character varying(60) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_Hashtag" PRIMARY KEY ("Id")
);

CREATE TABLE "Post" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Content" character varying(2000) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_Post" PRIMARY KEY ("Id")
);

CREATE TABLE "Story" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "MediaUrl" character varying(500) NOT NULL,
    "MediaType" character varying(20) NOT NULL,
    "Content" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    "ExpiredAt" timestamp with time zone NOT NULL,
    "IsDeleted" boolean NOT NULL,
    CONSTRAINT "PK_Story" PRIMARY KEY ("Id")
);

CREATE TABLE "UserBlockRelationReadModel" (
    "OwnerUserId" uuid NOT NULL,
    "BlockedUserId" uuid NOT NULL,
    "IsBlocked" boolean NOT NULL,
    "UpdatedAtUtc" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_UserBlockRelationReadModel" PRIMARY KEY ("OwnerUserId", "BlockedUserId")
);

CREATE TABLE "UserContactReadModel" (
    "OwnerUserId" uuid NOT NULL,
    "ContactUserId" uuid NOT NULL,
    "IsActive" boolean NOT NULL,
    "UpdatedAtUtc" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_UserContactReadModel" PRIMARY KEY ("OwnerUserId", "ContactUserId")
);

CREATE TABLE "UserProfileReadModel" (
    "UserId" uuid NOT NULL,
    "DisplayName" character varying(120) NOT NULL,
    "AvatarUrl" character varying(2000) NOT NULL,
    "UpdatedAtUtc" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_UserProfileReadModel" PRIMARY KEY ("UserId")
);

CREATE TABLE "UserReadModelSyncState" (
    "UserId" uuid NOT NULL,
    "LastBlockedSnapshotAtUtc" timestamp with time zone,
    "LastContactSnapshotAtUtc" timestamp with time zone,
    "UpdatedAtUtc" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_UserReadModelSyncState" PRIMARY KEY ("UserId")
);

CREATE TABLE "UserReport" (
    "Id" uuid NOT NULL,
    "TargetUserId" uuid NOT NULL,
    "ReportedByUserId" uuid NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(30) NOT NULL,
    "ResolvedByUserId" uuid,
    "ResolvedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_UserReport" PRIMARY KEY ("Id")
);

CREATE TABLE "Comment" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "ParentCommentId" uuid,
    "UserId" uuid NOT NULL,
    "Content" character varying(1000) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_Comment" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Comment_Comment_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "Comment" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Comment_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Like" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(20) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_Like" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Like_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "PostHashtag" (
    "PostId" uuid NOT NULL,
    "HashtagId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_PostHashtag" PRIMARY KEY ("PostId", "HashtagId"),
    CONSTRAINT "FK_PostHashtag_Hashtag_HashtagId" FOREIGN KEY ("HashtagId") REFERENCES "Hashtag" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PostHashtag_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "PostMedia" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "MediaUrl" character varying(2000) NOT NULL,
    "MediaType" character varying(20) NOT NULL,
    "SortOrder" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_PostMedia" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PostMedia_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "PostReport" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "ReportedByUserId" uuid NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(30) NOT NULL,
    "ResolvedByUserId" uuid,
    "ResolvedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_PostReport" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PostReport_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "SavedPost" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SavedPost" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SavedPost_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id") ON DELETE CASCADE
);

CREATE TABLE "StoryReaction" (
    "Id" uuid NOT NULL,
    "StoryId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(20) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_StoryReaction" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_StoryReaction_Story_StoryId" FOREIGN KEY ("StoryId") REFERENCES "Story" ("Id") ON DELETE CASCADE
);

CREATE TABLE "StoryReport" (
    "Id" uuid NOT NULL,
    "StoryId" uuid NOT NULL,
    "ReportedByUserId" uuid NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(30) NOT NULL,
    "ResolvedByUserId" uuid,
    "ResolvedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_StoryReport" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_StoryReport_Story_StoryId" FOREIGN KEY ("StoryId") REFERENCES "Story" ("Id") ON DELETE CASCADE
);

CREATE TABLE "StoryView" (
    "Id" uuid NOT NULL,
    "StoryId" uuid NOT NULL,
    "ViewerId" uuid NOT NULL,
    "ViewedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_StoryView" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_StoryView_Story_StoryId" FOREIGN KEY ("StoryId") REFERENCES "Story" ("Id") ON DELETE CASCADE
);

CREATE TABLE "CommentReaction" (
    "Id" uuid NOT NULL,
    "CommentId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(20) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_CommentReaction" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CommentReaction_Comment_CommentId" FOREIGN KEY ("CommentId") REFERENCES "Comment" ("Id") ON DELETE CASCADE
);

CREATE TABLE "CommentReport" (
    "Id" uuid NOT NULL,
    "CommentId" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "ReportedByUserId" uuid NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(30) NOT NULL,
    "ResolvedByUserId" uuid,
    "ResolvedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_CommentReport" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CommentReport_Comment_CommentId" FOREIGN KEY ("CommentId") REFERENCES "Comment" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Notification" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ActorUserId" uuid NOT NULL,
    "PostId" uuid,
    "CommentId" uuid,
    "Type" character varying(30) NOT NULL,
    "Message" character varying(500) NOT NULL,
    "IsRead" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "PK_Notification" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notification_Comment_CommentId" FOREIGN KEY ("CommentId") REFERENCES "Comment" ("Id"),
    CONSTRAINT "FK_Notification_Post_PostId" FOREIGN KEY ("PostId") REFERENCES "Post" ("Id")
);

CREATE INDEX "IX_AdminAuditLog_ActionType" ON "AdminAuditLog" ("ActionType");

CREATE INDEX "IX_AdminAuditLog_AdminUserId" ON "AdminAuditLog" ("AdminUserId");

CREATE INDEX "IX_AdminAuditLog_CreatedAt" ON "AdminAuditLog" ("CreatedAt");

CREATE INDEX "IX_AdminAuditLog_EntityType" ON "AdminAuditLog" ("EntityType");

CREATE INDEX "IX_AppReview_CreatedAt" ON "AppReview" ("CreatedAt");

CREATE INDEX "IX_AppReview_IsHidden" ON "AppReview" ("IsHidden");

CREATE INDEX "IX_AppReview_Rating" ON "AppReview" ("Rating");

CREATE UNIQUE INDEX "IX_AppReview_UserId" ON "AppReview" ("UserId");

CREATE INDEX "IX_Comment_ParentCommentId" ON "Comment" ("ParentCommentId");

CREATE INDEX "IX_Comment_PostId" ON "Comment" ("PostId");

CREATE INDEX "IX_Comment_UserId" ON "Comment" ("UserId");

CREATE INDEX "IX_CommentReaction_CommentId" ON "CommentReaction" ("CommentId");

CREATE UNIQUE INDEX "IX_CommentReaction_CommentId_UserId" ON "CommentReaction" ("CommentId", "UserId");

CREATE INDEX "IX_CommentReaction_UserId" ON "CommentReaction" ("UserId");

CREATE INDEX "IX_CommentReport_CommentId" ON "CommentReport" ("CommentId");

CREATE INDEX "IX_CommentReport_PostId" ON "CommentReport" ("PostId");

CREATE INDEX "IX_CommentReport_ReportedByUserId" ON "CommentReport" ("ReportedByUserId");

CREATE INDEX "IX_CommentReport_Status" ON "CommentReport" ("Status");

CREATE UNIQUE INDEX "IX_Hashtag_NormalizedName" ON "Hashtag" ("NormalizedName");

CREATE INDEX "IX_Like_PostId" ON "Like" ("PostId");

CREATE UNIQUE INDEX "IX_Like_PostId_UserId" ON "Like" ("PostId", "UserId");

CREATE INDEX "IX_Like_UserId" ON "Like" ("UserId");

CREATE INDEX "IX_Notification_CommentId" ON "Notification" ("CommentId");

CREATE INDEX "IX_Notification_CreatedAt" ON "Notification" ("CreatedAt");

CREATE INDEX "IX_Notification_IsRead" ON "Notification" ("IsRead");

CREATE INDEX "IX_Notification_PostId" ON "Notification" ("PostId");

CREATE INDEX "IX_Notification_UserId" ON "Notification" ("UserId");

CREATE INDEX "IX_Post_CreatedAt" ON "Post" ("CreatedAt");

CREATE INDEX "IX_Post_UserId" ON "Post" ("UserId");

CREATE INDEX "IX_PostHashtag_HashtagId" ON "PostHashtag" ("HashtagId");

CREATE INDEX "IX_PostMedia_PostId" ON "PostMedia" ("PostId");

CREATE UNIQUE INDEX "IX_PostMedia_PostId_SortOrder" ON "PostMedia" ("PostId", "SortOrder");

CREATE INDEX "IX_PostReport_PostId" ON "PostReport" ("PostId");

CREATE INDEX "IX_PostReport_ReportedByUserId" ON "PostReport" ("ReportedByUserId");

CREATE INDEX "IX_PostReport_Status" ON "PostReport" ("Status");

CREATE INDEX "IX_SavedPost_CreatedAt" ON "SavedPost" ("CreatedAt");

CREATE INDEX "IX_SavedPost_PostId" ON "SavedPost" ("PostId");

CREATE INDEX "IX_SavedPost_UserId" ON "SavedPost" ("UserId");

CREATE UNIQUE INDEX "IX_SavedPost_UserId_PostId" ON "SavedPost" ("UserId", "PostId");

CREATE INDEX "IX_Story_ExpiredAt" ON "Story" ("ExpiredAt");

CREATE INDEX "IX_Story_UserId" ON "Story" ("UserId");

CREATE INDEX "IX_StoryReaction_StoryId" ON "StoryReaction" ("StoryId");

CREATE UNIQUE INDEX "IX_StoryReaction_StoryId_UserId" ON "StoryReaction" ("StoryId", "UserId");

CREATE INDEX "IX_StoryReaction_UserId" ON "StoryReaction" ("UserId");

CREATE INDEX "IX_StoryReport_ReportedByUserId" ON "StoryReport" ("ReportedByUserId");

CREATE INDEX "IX_StoryReport_Status" ON "StoryReport" ("Status");

CREATE INDEX "IX_StoryReport_StoryId" ON "StoryReport" ("StoryId");

CREATE INDEX "IX_StoryView_StoryId" ON "StoryView" ("StoryId");

CREATE UNIQUE INDEX "IX_StoryView_StoryId_ViewerId" ON "StoryView" ("StoryId", "ViewerId");

CREATE INDEX "IX_StoryView_ViewerId" ON "StoryView" ("ViewerId");

CREATE INDEX "IX_UserBlockRelationReadModel_BlockedUserId" ON "UserBlockRelationReadModel" ("BlockedUserId");

CREATE INDEX "IX_UserBlockRelationReadModel_OwnerUserId" ON "UserBlockRelationReadModel" ("OwnerUserId");

CREATE INDEX "IX_UserBlockRelationReadModel_OwnerUserId_IsBlocked" ON "UserBlockRelationReadModel" ("OwnerUserId", "IsBlocked");

CREATE INDEX "IX_UserContactReadModel_ContactUserId" ON "UserContactReadModel" ("ContactUserId");

CREATE INDEX "IX_UserContactReadModel_OwnerUserId" ON "UserContactReadModel" ("OwnerUserId");

CREATE INDEX "IX_UserContactReadModel_OwnerUserId_IsActive" ON "UserContactReadModel" ("OwnerUserId", "IsActive");

CREATE INDEX "IX_UserReport_ReportedByUserId" ON "UserReport" ("ReportedByUserId");

CREATE INDEX "IX_UserReport_Status" ON "UserReport" ("Status");

CREATE INDEX "IX_UserReport_TargetUserId" ON "UserReport" ("TargetUserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260502171917_InitialPostgres', '8.0.5');

COMMIT;

