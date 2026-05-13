namespace InteractHub.Api.Common.Constants;

public static class ReportNotificationMessageConstants
{
    public static class Comment
    {
        public const string ReporterApproved =
            "Your comment report was approved and the reported comment was removed.";

        public const string TargetRemoved =
            "Your comment was removed by an admin for violating our community guidelines.";

        public const string ReporterRejected =
            "Your comment report was rejected after review.";
    }

    public static class Story
    {
        public const string ReporterApproved =
            "Your story report was approved and the reported story was removed.";

        public const string TargetRemoved =
            "Your story was removed by an admin for violating our community guidelines.";

        public const string ReporterRejected =
            "Your story report was rejected after review.";
    }

    public static class Post
    {
        public const string FriendPostFormat = "{0} shared a new post.";

        public const string ReporterApproved =
            "Your post report was approved and the reported post was removed.";

        public const string TargetRemoved =
            "Your post was removed by an admin for violating our community guidelines.";

        public const string ReporterRejected =
            "Your post report was rejected after review.";
    }

    public static class User
    {
        public const string ReporterApproved =
            "Your user report was approved and the reported account was banned.";

        public const string TargetRemoved =
            "Your account was banned due to policy violations.";

        public const string ReporterRejected =
            "Your user report was rejected after review.";
    }
}
