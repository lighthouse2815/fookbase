IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Hashtag] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(60) NOT NULL,
        [NormalizedName] nvarchar(60) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Hashtag] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Post] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Content] nvarchar(2000) NOT NULL,
        [ImageUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Post] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Story] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [MediaUrl] nvarchar(500) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Story] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Comment] (
        [Id] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Content] nvarchar(1000) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Comment] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Comment_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Like] (
        [Id] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Like] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Like_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [PostHashtag] (
        [PostId] uniqueidentifier NOT NULL,
        [HashtagId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_PostHashtag] PRIMARY KEY ([PostId], [HashtagId]),
        CONSTRAINT [FK_PostHashtag_Hashtag_HashtagId] FOREIGN KEY ([HashtagId]) REFERENCES [Hashtag] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PostHashtag_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [PostReport] (
        [Id] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NOT NULL,
        [ReportedByUserId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [ResolvedByUserId] uniqueidentifier NULL,
        [ResolvedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_PostReport] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PostReport_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE TABLE [Notification] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [ActorUserId] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NULL,
        [CommentId] uniqueidentifier NULL,
        [Type] nvarchar(30) NOT NULL,
        [Message] nvarchar(500) NOT NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Notification] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notification_Comment_CommentId] FOREIGN KEY ([CommentId]) REFERENCES [Comment] ([Id]),
        CONSTRAINT [FK_Notification_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Comment_PostId] ON [Comment] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Comment_UserId] ON [Comment] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Hashtag_NormalizedName] ON [Hashtag] ([NormalizedName]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Like_PostId_UserId] ON [Like] ([PostId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Like_UserId] ON [Like] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Notification_CommentId] ON [Notification] ([CommentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Notification_CreatedAt] ON [Notification] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Notification_IsRead] ON [Notification] ([IsRead]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Notification_PostId] ON [Notification] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Notification_UserId] ON [Notification] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Post_CreatedAt] ON [Post] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Post_UserId] ON [Post] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_PostHashtag_HashtagId] ON [PostHashtag] ([HashtagId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_PostReport_PostId] ON [PostReport] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_PostReport_ReportedByUserId] ON [PostReport] ([ReportedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_PostReport_Status] ON [PostReport] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Story_ExpiresAt] ON [Story] ([ExpiresAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    CREATE INDEX [IX_Story_UserId] ON [Story] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318140539_Init'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260318140539_Init', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330061500_AllowLargePostMedia'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Post]') AND [c].[name] = N'ImageUrl');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Post] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Post] ALTER COLUMN [ImageUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330061500_AllowLargePostMedia'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330061500_AllowLargePostMedia', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    CREATE TABLE [SavedPost] (
        [Id] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SavedPost] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SavedPost_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    CREATE INDEX [IX_SavedPost_CreatedAt] ON [SavedPost] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    CREATE INDEX [IX_SavedPost_PostId] ON [SavedPost] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    CREATE INDEX [IX_SavedPost_UserId] ON [SavedPost] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SavedPost_UserId_PostId] ON [SavedPost] ([UserId], [PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331131134_AddSavedPosts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331131134_AddSavedPosts', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    DROP INDEX [IX_Story_ExpiresAt] ON [Story];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Story]') AND [c].[name] = N'DeletedAt');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Story] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Story] DROP COLUMN [DeletedAt];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    EXEC sp_rename N'[Story].[ExpiresAt]', N'ExpiredAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Story]') AND [c].[name] = N'UpdatedAt');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Story] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [Story] DROP COLUMN [UpdatedAt];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    ALTER TABLE [Story] ADD [Content] nvarchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    ALTER TABLE [Story] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    ALTER TABLE [Story] ADD [MediaType] nvarchar(20) NOT NULL DEFAULT N'IMAGE';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    UPDATE [Story] SET [MediaType] = 'IMAGE' WHERE [MediaType] = '';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    CREATE TABLE [StoryView] (
        [Id] uniqueidentifier NOT NULL,
        [StoryId] uniqueidentifier NOT NULL,
        [ViewerId] uniqueidentifier NOT NULL,
        [ViewedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StoryView] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StoryView_Story_StoryId] FOREIGN KEY ([StoryId]) REFERENCES [Story] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    CREATE INDEX [IX_Story_ExpiredAt] ON [Story] ([ExpiredAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    CREATE INDEX [IX_StoryView_StoryId] ON [StoryView] ([StoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    CREATE UNIQUE INDEX [IX_StoryView_StoryId_ViewerId] ON [StoryView] ([StoryId], [ViewerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    CREATE INDEX [IX_StoryView_ViewerId] ON [StoryView] ([ViewerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331180406_RevampStoriesWithViews'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331180406_RevampStoriesWithViews', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405121120_AddCommentReactions'
)
BEGIN
    CREATE TABLE [CommentReaction] (
        [Id] uniqueidentifier NOT NULL,
        [CommentId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CommentReaction] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CommentReaction_Comment_CommentId] FOREIGN KEY ([CommentId]) REFERENCES [Comment] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405121120_AddCommentReactions'
)
BEGIN
    CREATE INDEX [IX_CommentReaction_CommentId] ON [CommentReaction] ([CommentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405121120_AddCommentReactions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CommentReaction_CommentId_UserId] ON [CommentReaction] ([CommentId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405121120_AddCommentReactions'
)
BEGIN
    CREATE INDEX [IX_CommentReaction_UserId] ON [CommentReaction] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405121120_AddCommentReactions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260405121120_AddCommentReactions', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405164754_AddCommentReplies'
)
BEGIN
    ALTER TABLE [Comment] ADD [ParentCommentId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405164754_AddCommentReplies'
)
BEGIN
    CREATE INDEX [IX_Comment_ParentCommentId] ON [Comment] ([ParentCommentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405164754_AddCommentReplies'
)
BEGIN
    ALTER TABLE [Comment] ADD CONSTRAINT [FK_Comment_Comment_ParentCommentId] FOREIGN KEY ([ParentCommentId]) REFERENCES [Comment] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260405164754_AddCommentReplies'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260405164754_AddCommentReplies', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260406131920_AddPostReactions'
)
BEGIN
    ALTER TABLE [Like] ADD [Type] nvarchar(20) NOT NULL DEFAULT N'LIKE';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260406131920_AddPostReactions'
)
BEGIN
    CREATE INDEX [IX_Like_PostId] ON [Like] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260406131920_AddPostReactions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260406131920_AddPostReactions', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408135235_AddStoryReactions'
)
BEGIN
    CREATE TABLE [StoryReaction] (
        [Id] uniqueidentifier NOT NULL,
        [StoryId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StoryReaction] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StoryReaction_Story_StoryId] FOREIGN KEY ([StoryId]) REFERENCES [Story] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408135235_AddStoryReactions'
)
BEGIN
    CREATE INDEX [IX_StoryReaction_StoryId] ON [StoryReaction] ([StoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408135235_AddStoryReactions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_StoryReaction_StoryId_UserId] ON [StoryReaction] ([StoryId], [UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408135235_AddStoryReactions'
)
BEGIN
    CREATE INDEX [IX_StoryReaction_UserId] ON [StoryReaction] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260408135235_AddStoryReactions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260408135235_AddStoryReactions', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415210045_AddUserReports'
)
BEGIN
    CREATE TABLE [UserReport] (
        [Id] uniqueidentifier NOT NULL,
        [TargetUserId] uniqueidentifier NOT NULL,
        [ReportedByUserId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [ResolvedByUserId] uniqueidentifier NULL,
        [ResolvedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_UserReport] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415210045_AddUserReports'
)
BEGIN
    CREATE INDEX [IX_UserReport_ReportedByUserId] ON [UserReport] ([ReportedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415210045_AddUserReports'
)
BEGIN
    CREATE INDEX [IX_UserReport_Status] ON [UserReport] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415210045_AddUserReports'
)
BEGIN
    CREATE INDEX [IX_UserReport_TargetUserId] ON [UserReport] ([TargetUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415210045_AddUserReports'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260415210045_AddUserReports', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE TABLE [AdminAuditLog] (
        [Id] uniqueidentifier NOT NULL,
        [AdminUserId] uniqueidentifier NOT NULL,
        [ActionType] nvarchar(60) NOT NULL,
        [EntityType] nvarchar(40) NOT NULL,
        [EntityId] uniqueidentifier NULL,
        [TargetUserId] uniqueidentifier NULL,
        [Details] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AdminAuditLog] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE TABLE [StoryReport] (
        [Id] uniqueidentifier NOT NULL,
        [StoryId] uniqueidentifier NOT NULL,
        [ReportedByUserId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [ResolvedByUserId] uniqueidentifier NULL,
        [ResolvedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_StoryReport] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StoryReport_Story_StoryId] FOREIGN KEY ([StoryId]) REFERENCES [Story] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_AdminAuditLog_ActionType] ON [AdminAuditLog] ([ActionType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_AdminAuditLog_AdminUserId] ON [AdminAuditLog] ([AdminUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_AdminAuditLog_CreatedAt] ON [AdminAuditLog] ([CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_AdminAuditLog_EntityType] ON [AdminAuditLog] ([EntityType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_StoryReport_ReportedByUserId] ON [StoryReport] ([ReportedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_StoryReport_Status] ON [StoryReport] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    CREATE INDEX [IX_StoryReport_StoryId] ON [StoryReport] ([StoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415222616_AddStoryReportsAndAdminAudit'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260415222616_AddStoryReportsAndAdminAudit', N'8.0.5');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419172458_AddPostMediaTable'
)
BEGIN
    CREATE TABLE [PostMedia] (
        [Id] uniqueidentifier NOT NULL,
        [PostId] uniqueidentifier NOT NULL,
        [MediaUrl] nvarchar(2000) NOT NULL,
        [MediaType] nvarchar(20) NOT NULL,
        [SortOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PostMedia] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PostMedia_Post_PostId] FOREIGN KEY ([PostId]) REFERENCES [Post] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419172458_AddPostMediaTable'
)
BEGIN
    CREATE INDEX [IX_PostMedia_PostId] ON [PostMedia] ([PostId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419172458_AddPostMediaTable'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PostMedia_PostId_SortOrder] ON [PostMedia] ([PostId], [SortOrder]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419172458_AddPostMediaTable'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419172458_AddPostMediaTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260419172458_AddPostMediaTable', N'8.0.5');
END;
GO

COMMIT;
GO

