BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419180657_DropLegacyPostImageUrlColumn'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Post]') AND [c].[name] = N'ImageUrl');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Post] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Post] DROP COLUMN [ImageUrl];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419180657_DropLegacyPostImageUrlColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260419180657_DropLegacyPostImageUrlColumn', N'8.0.5');
END;
GO

COMMIT;
GO

