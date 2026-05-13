using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Post> Posts => Set<Post>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();

    public DbSet<CommentMedia> CommentMedias => Set<CommentMedia>();

    public DbSet<Like> Likes => Set<Like>();

    public DbSet<Story> Stories => Set<Story>();

    public DbSet<StoryReaction> StoryReactions => Set<StoryReaction>();

    public DbSet<StoryView> StoryViews => Set<StoryView>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<Hashtag> Hashtags => Set<Hashtag>();

    public DbSet<PostHashtag> PostHashtags => Set<PostHashtag>();

    public DbSet<PostMedia> PostMedias => Set<PostMedia>();

    public DbSet<PostReport> PostReports => Set<PostReport>();

    public DbSet<CommentReport> CommentReports => Set<CommentReport>();

    public DbSet<UserReport> UserReports => Set<UserReport>();

    public DbSet<StoryReport> StoryReports => Set<StoryReport>();

    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    public DbSet<SavedPost> SavedPosts => Set<SavedPost>();

    public DbSet<AppReview> AppReviews => Set<AppReview>();

    public DbSet<UserProfileSummaryReadModel> UserProfileSummaryReadModels => Set<UserProfileSummaryReadModel>();

    public DbSet<FriendshipReadModel> FriendshipReadModels => Set<FriendshipReadModel>();

    public DbSet<FriendshipReadModelSyncState> FriendshipReadModelSyncStates => Set<FriendshipReadModelSyncState>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureSocialTables(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    private static void ConfigureSocialTables(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Post>(entity =>
        {
            entity.ToTable("Post");
            entity.HasKey(post => post.Id);

            entity.Property(post => post.Content).HasMaxLength(2000).IsRequired();

            entity.HasOne(post => post.OriginalPost)
                .WithMany(post => post.SharedPosts)
                .HasForeignKey(post => post.OriginalPostId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(post => post.DeletedAt == null);

            entity.HasIndex(post => post.UserId);
            entity.HasIndex(post => post.OriginalPostId);
            entity.HasIndex(post => post.CreatedAt);
        });

        modelBuilder.Entity<PostMedia>(entity =>
        {
            entity.ToTable("PostMedia");
            entity.HasKey(media => media.Id);

            entity.Property(media => media.MediaUrl)
                .HasMaxLength(2000)
                .IsRequired();
            entity.Property(media => media.MediaType)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseMediaType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(media => media.SortOrder).IsRequired();
            entity.Property(media => media.CreatedAt).IsRequired();

            entity.HasOne(media => media.Post)
                .WithMany(post => post.MediaItems)
                .HasForeignKey(media => media.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(media => media.PostId);
            entity.HasIndex(media => new { media.PostId, media.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comment");
            entity.HasKey(comment => comment.Id);

            entity.Property(comment => comment.Content).HasMaxLength(1000).IsRequired();

            entity.HasOne(comment => comment.Post)
                .WithMany(post => post.Comments)
                .HasForeignKey(comment => comment.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(comment => comment.ParentComment)
                .WithMany(comment => comment.Replies)
                .HasForeignKey(comment => comment.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(comment => comment.DeletedAt == null);

            entity.HasIndex(comment => comment.PostId);
            entity.HasIndex(comment => comment.ParentCommentId);
            entity.HasIndex(comment => comment.UserId);
        });

        modelBuilder.Entity<CommentMedia>(entity =>
        {
            entity.ToTable("CommentMedia");
            entity.HasKey(media => media.Id);

            entity.Property(media => media.MediaUrl)
                .HasMaxLength(2000)
                .IsRequired();
            entity.Property(media => media.MediaType)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseMediaType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(media => media.SortOrder).IsRequired();
            entity.Property(media => media.CreatedAt).IsRequired();

            entity.HasOne(media => media.Comment)
                .WithMany(comment => comment.MediaItems)
                .HasForeignKey(media => media.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(media => media.CommentId);
            entity.HasIndex(media => new { media.CommentId, media.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<CommentReaction>(entity =>
        {
            entity.ToTable("CommentReaction");
            entity.HasKey(commentReaction => commentReaction.Id);

            entity.Property(commentReaction => commentReaction.Type)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReactionType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(commentReaction => commentReaction.CreatedAt).IsRequired();
            entity.Property(commentReaction => commentReaction.UpdatedAt).IsRequired();

            entity.HasOne(commentReaction => commentReaction.Comment)
                .WithMany(comment => comment.Reactions)
                .HasForeignKey(commentReaction => commentReaction.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(commentReaction => new { commentReaction.CommentId, commentReaction.UserId }).IsUnique();
            entity.HasIndex(commentReaction => commentReaction.UserId);
            entity.HasIndex(commentReaction => commentReaction.CommentId);
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.ToTable("Like");
            entity.HasKey(like => like.Id);

            entity.Property(like => like.Type)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReactionType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(like => like.CreatedAt).IsRequired();
            entity.Property(like => like.UpdatedAt).IsRequired();

            entity.HasOne(like => like.Post)
                .WithMany(post => post.Likes)
                .HasForeignKey(like => like.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(like => new { like.PostId, like.UserId }).IsUnique();
            entity.HasIndex(like => like.UserId);
            entity.HasIndex(like => like.PostId);
        });

        modelBuilder.Entity<Story>(entity =>
        {
            entity.ToTable("Story");
            entity.HasKey(story => story.Id);

            entity.Property(story => story.MediaUrl).HasMaxLength(500).IsRequired();
            entity.Property(story => story.MediaType)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseMediaType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(story => story.Content).HasMaxLength(500);

            entity.HasQueryFilter(story => !story.IsDeleted);

            entity.HasIndex(story => story.UserId);
            entity.HasIndex(story => story.ExpiredAt);
        });

        modelBuilder.Entity<StoryReaction>(entity =>
        {
            entity.ToTable("StoryReaction");
            entity.HasKey(storyReaction => storyReaction.Id);

            entity.Property(storyReaction => storyReaction.Type)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReactionType(value))
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(storyReaction => storyReaction.CreatedAt).IsRequired();
            entity.Property(storyReaction => storyReaction.UpdatedAt).IsRequired();

            entity.HasOne(storyReaction => storyReaction.Story)
                .WithMany(story => story.Reactions)
                .HasForeignKey(storyReaction => storyReaction.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(storyReaction => new { storyReaction.StoryId, storyReaction.UserId }).IsUnique();
            entity.HasIndex(storyReaction => storyReaction.UserId);
            entity.HasIndex(storyReaction => storyReaction.StoryId);
        });

        modelBuilder.Entity<StoryView>(entity =>
        {
            entity.ToTable("StoryView");
            entity.HasKey(storyView => storyView.Id);

            entity.Property(storyView => storyView.ViewedAt).IsRequired();

            entity.HasOne(storyView => storyView.Story)
                .WithMany(story => story.Views)
                .HasForeignKey(storyView => storyView.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(storyView => storyView.StoryId);
            entity.HasIndex(storyView => storyView.ViewerId);
            entity.HasIndex(storyView => new { storyView.StoryId, storyView.ViewerId }).IsUnique();
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notification");
            entity.HasKey(notification => notification.Id);

            entity.Property(notification => notification.Type)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseNotificationType(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(notification => notification.Message).HasMaxLength(500).IsRequired();
            entity.Property(notification => notification.UpdatedAt).IsRequired();

            entity.HasOne<Post>()
                .WithMany()
                .HasForeignKey(notification => notification.PostId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Comment>()
                .WithMany()
                .HasForeignKey(notification => notification.CommentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Story>()
                .WithMany()
                .HasForeignKey(notification => notification.StoryId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(notification => notification.UserId);
            entity.HasIndex(notification => notification.IsRead);
            entity.HasIndex(notification => notification.CreatedAt);
            entity.HasIndex(notification => notification.StoryId);
        });

        modelBuilder.Entity<Hashtag>(entity =>
        {
            entity.ToTable("Hashtag");
            entity.HasKey(hashtag => hashtag.Id);

            entity.Property(hashtag => hashtag.Name).HasMaxLength(60).IsRequired();
            entity.Property(hashtag => hashtag.UpdatedAt).IsRequired();

            entity.HasIndex(hashtag => hashtag.Name).IsUnique();

            entity.HasQueryFilter(hashtag => hashtag.DeletedAt == null);
        });

        modelBuilder.Entity<PostHashtag>(entity =>
        {
            entity.ToTable("PostHashtag");
            entity.HasKey(postHashtag => new { postHashtag.PostId, postHashtag.HashtagId });
            entity.Property(postHashtag => postHashtag.CreatedAt).IsRequired();
            entity.Property(postHashtag => postHashtag.UpdatedAt).IsRequired();

            entity.HasOne(postHashtag => postHashtag.Post)
                .WithMany(post => post.PostHashtags)
                .HasForeignKey(postHashtag => postHashtag.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(postHashtag => postHashtag.Hashtag)
                .WithMany(hashtag => hashtag.PostHashtags)
                .HasForeignKey(postHashtag => postHashtag.HashtagId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(postHashtag => postHashtag.DeletedAt == null);
        });

        modelBuilder.Entity<PostReport>(entity =>
        {
            entity.ToTable("PostReport");
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Reason).HasMaxLength(500).IsRequired();
            entity.Property(report => report.Status)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReportStatus(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(report => report.UpdatedAt).IsRequired();

            entity.HasOne(report => report.Post)
                .WithMany(post => post.Reports)
                .HasForeignKey(report => report.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(report => report.PostId);
            entity.HasIndex(report => report.ReportedByUserId);
            entity.HasIndex(report => report.Status);
        });

        modelBuilder.Entity<CommentReport>(entity =>
        {
            entity.ToTable("CommentReport");
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Reason).HasMaxLength(500).IsRequired();
            entity.Property(report => report.Status)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReportStatus(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(report => report.UpdatedAt).IsRequired();

            entity.HasOne(report => report.Comment)
                .WithMany(comment => comment.Reports)
                .HasForeignKey(report => report.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(report => report.CommentId);
            entity.HasIndex(report => report.PostId);
            entity.HasIndex(report => report.ReportedByUserId);
            entity.HasIndex(report => report.Status);
        });

        modelBuilder.Entity<UserReport>(entity =>
        {
            entity.ToTable("UserReport");
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Reason).HasMaxLength(500).IsRequired();
            entity.Property(report => report.Status)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReportStatus(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(report => report.UpdatedAt).IsRequired();

            entity.HasIndex(report => report.TargetUserId);
            entity.HasIndex(report => report.ReportedByUserId);
            entity.HasIndex(report => report.Status);
        });

        modelBuilder.Entity<StoryReport>(entity =>
        {
            entity.ToTable("StoryReport");
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Reason).HasMaxLength(500).IsRequired();
            entity.Property(report => report.Status)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseReportStatus(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(report => report.UpdatedAt).IsRequired();

            entity.HasOne(report => report.Story)
                .WithMany(story => story.Reports)
                .HasForeignKey(report => report.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(report => report.StoryId);
            entity.HasIndex(report => report.ReportedByUserId);
            entity.HasIndex(report => report.Status);
        });

        modelBuilder.Entity<AdminAuditLog>(entity =>
        {
            entity.ToTable("AdminAuditLog");
            entity.HasKey(log => log.Id);

            entity.Property(log => log.ActionType)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseAdminAuditActionType(value))
                .HasMaxLength(60)
                .IsRequired();
            entity.Property(log => log.EntityType)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseAdminAuditEntityType(value))
                .HasMaxLength(40)
                .IsRequired();
            entity.Property(log => log.EntityId).IsRequired();
            entity.Property(log => log.TargetUserId).IsRequired();
            entity.Property(log => log.Details)
                .HasMaxLength(1000)
                .IsRequired();
            entity.Property(log => log.CreatedAt).IsRequired();

            entity.HasIndex(log => log.AdminUserId);
            entity.HasIndex(log => log.EntityType);
            entity.HasIndex(log => log.ActionType);
            entity.HasIndex(log => log.CreatedAt);
        });

        modelBuilder.Entity<SavedPost>(entity =>
        {
            entity.ToTable("SavedPost");
            entity.HasKey(savedPost => savedPost.Id);

            entity.Property(savedPost => savedPost.CreatedAt).IsRequired();

            entity.HasOne(savedPost => savedPost.Post)
                .WithMany(post => post.SavedByUsers)
                .HasForeignKey(savedPost => savedPost.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(savedPost => new { savedPost.UserId, savedPost.PostId }).IsUnique();
            entity.HasIndex(savedPost => savedPost.UserId);
            entity.HasIndex(savedPost => savedPost.PostId);
            entity.HasIndex(savedPost => savedPost.CreatedAt);
        });

        modelBuilder.Entity<AppReview>(entity =>
        {
            entity.ToTable("AppReview", table =>
            {
                table.HasCheckConstraint("CK_AppReview_Rating", "\"Rating\" >= 1 AND \"Rating\" <= 5");
            });
            entity.HasKey(review => review.Id);

            entity.Property(review => review.DisplayName)
                .HasMaxLength(80)
                .IsRequired();
            entity.Property(review => review.Rating).IsRequired();
            entity.Property(review => review.Comment)
                .HasMaxLength(1000)
                .IsRequired();
            entity.Property(review => review.IsHidden).IsRequired();
            entity.Property(review => review.CreatedAt).IsRequired();
            entity.Property(review => review.UpdatedAt).IsRequired();

            entity.HasIndex(review => review.UserId).IsUnique();
            entity.HasIndex(review => review.IsHidden);
            entity.HasIndex(review => review.Rating);
            entity.HasIndex(review => review.CreatedAt);
        });

        modelBuilder.Entity<UserProfileSummaryReadModel>(entity =>
        {
            entity.ToTable("UserProfileSummaryReadModel");
            entity.HasKey(profile => profile.UserId);

            entity.Property(profile => profile.DisplayName)
                .HasMaxLength(120)
                .IsRequired();
            entity.Property(profile => profile.AvatarUrl)
                .HasMaxLength(2000)
                .IsRequired();
            entity.Property(profile => profile.UpdatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<FriendshipReadModel>(entity =>
        {
            entity.ToTable("FriendshipReadModel");
            entity.HasKey(relation => new { relation.OwnerUserId, relation.OtherUserId });

            entity.Property(relation => relation.Status)
                .HasConversion(
                    type => type.ToString(),
                    value => ParseFriendshipStatus(value))
                .HasMaxLength(30)
                .IsRequired();
            entity.Property(relation => relation.UpdatedAtUtc).IsRequired();

            entity.HasIndex(relation => relation.OwnerUserId);
            entity.HasIndex(relation => relation.OtherUserId);
            entity.HasIndex(relation => new { relation.OwnerUserId, relation.Status });
        });

        modelBuilder.Entity<FriendshipReadModelSyncState>(entity =>
        {
            // Keep table name to avoid a breaking rename migration at this step.
            entity.ToTable("UserReadModelSyncState");
            entity.HasKey(state => state.UserId);

            entity.Property(state => state.UpdatedAtUtc).IsRequired();
        });
    }

    private static NotificationType ParseNotificationType(string? value)
    {
        return EnumParser.TryParseNotificationType(value, out var parsedType)
            ? parsedType
            : NotificationType.GENERAL;
    }

    private static MediaType ParseMediaType(string? value)
    {
        return EnumParser.TryParseMediaType(value, out var parsedType)
            ? parsedType
            : MediaType.IMAGE;
    }

    private static ReactionType ParseReactionType(string? value)
    {
        return EnumParser.TryParseReactionType(value, out var parsedType)
            ? parsedType
            : ReactionType.LIKE;
    }

    private static ReportStatus ParseReportStatus(string? value)
    {
        return EnumParser.TryParseReportStatus(value, out var parsedType)
            ? parsedType
            : ReportStatus.PENDING;
    }

    private static FriendshipStatus ParseFriendshipStatus(string? value)
    {
        return Enum.TryParse(value?.Trim(), ignoreCase: true, out FriendshipStatus parsedStatus)
            && Enum.IsDefined(parsedStatus)
            ? parsedStatus
            : FriendshipStatus.REMOVED;
    }

    private static AdminAuditActionType ParseAdminAuditActionType(string? value)
    {
        return Enum.TryParse(value?.Trim(), ignoreCase: true, out AdminAuditActionType parsedType)
            && Enum.IsDefined(parsedType)
            ? parsedType
            : AdminAuditActionType.USER_STATUS_UPDATED;
    }

    private static AdminAuditEntityType ParseAdminAuditEntityType(string? value)
    {
        return Enum.TryParse(value?.Trim(), ignoreCase: true, out AdminAuditEntityType parsedType)
            && Enum.IsDefined(parsedType)
            ? parsedType
            : AdminAuditEntityType.USER;
    }
}



