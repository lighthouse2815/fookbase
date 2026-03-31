using InteractHub.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Post> Posts => Set<Post>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<Like> Likes => Set<Like>();

    public DbSet<Story> Stories => Set<Story>();

    public DbSet<StoryView> StoryViews => Set<StoryView>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<Hashtag> Hashtags => Set<Hashtag>();

    public DbSet<PostHashtag> PostHashtags => Set<PostHashtag>();

    public DbSet<PostReport> PostReports => Set<PostReport>();

    public DbSet<SavedPost> SavedPosts => Set<SavedPost>();

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
            entity.Property(post => post.ImageUrl).HasColumnType("nvarchar(max)");

            entity.HasQueryFilter(post => post.DeletedAt == null);

            entity.HasIndex(post => post.UserId);
            entity.HasIndex(post => post.CreatedAt);
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

            entity.HasQueryFilter(comment => comment.DeletedAt == null);

            entity.HasIndex(comment => comment.PostId);
            entity.HasIndex(comment => comment.UserId);
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.ToTable("Like");
            entity.HasKey(like => like.Id);

            entity.HasOne(like => like.Post)
                .WithMany(post => post.Likes)
                .HasForeignKey(like => like.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(like => new { like.PostId, like.UserId }).IsUnique();
            entity.HasIndex(like => like.UserId);
        });

        modelBuilder.Entity<Story>(entity =>
        {
            entity.ToTable("Story");
            entity.HasKey(story => story.Id);

            entity.Property(story => story.MediaUrl).HasMaxLength(500).IsRequired();
            entity.Property(story => story.MediaType).HasMaxLength(20).IsRequired();
            entity.Property(story => story.Content).HasMaxLength(500);

            entity.HasQueryFilter(story => !story.IsDeleted);

            entity.HasIndex(story => story.UserId);
            entity.HasIndex(story => story.ExpiredAt);
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

            entity.Property(notification => notification.Type).HasMaxLength(30).IsRequired();
            entity.Property(notification => notification.Message).HasMaxLength(500).IsRequired();

            entity.HasOne<Post>()
                .WithMany()
                .HasForeignKey(notification => notification.PostId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Comment>()
                .WithMany()
                .HasForeignKey(notification => notification.CommentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(notification => notification.UserId);
            entity.HasIndex(notification => notification.IsRead);
            entity.HasIndex(notification => notification.CreatedAt);
        });

        modelBuilder.Entity<Hashtag>(entity =>
        {
            entity.ToTable("Hashtag");
            entity.HasKey(hashtag => hashtag.Id);

            entity.Property(hashtag => hashtag.Name).HasMaxLength(60).IsRequired();
            entity.Property(hashtag => hashtag.NormalizedName).HasMaxLength(60).IsRequired();

            entity.HasIndex(hashtag => hashtag.NormalizedName).IsUnique();

            entity.HasQueryFilter(hashtag => hashtag.DeletedAt == null);
        });

        modelBuilder.Entity<PostHashtag>(entity =>
        {
            entity.ToTable("PostHashtag");
            entity.HasKey(postHashtag => new { postHashtag.PostId, postHashtag.HashtagId });

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
            entity.Property(report => report.Status).HasMaxLength(30).IsRequired();
            entity.Property(report => report.UpdatedAt).IsRequired();

            entity.HasOne(report => report.Post)
                .WithMany(post => post.Reports)
                .HasForeignKey(report => report.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(report => report.PostId);
            entity.HasIndex(report => report.ReportedByUserId);
            entity.HasIndex(report => report.Status);
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
    }
}
