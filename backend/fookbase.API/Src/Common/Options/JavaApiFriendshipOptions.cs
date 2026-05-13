namespace InteractHub.Api.Common.Options;

public class JavaApiFriendshipOptions
{
    public const string SectionName = "JavaApi:Friendship";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string FriendsByUserIdPathTemplate { get; set; } = "friendships?userId={userId}";

    public string UserSuggestionsPathTemplate { get; set; } = "users/suggestions?page={page}&size={size}";

    public string MessengerPendingRequestersPathTemplate { get; set; } = "messenger/friendships/pending-requesters";

    public string MessengerContactsByUserPathTemplate { get; set; } = "messenger/contacts/getByUser";

    public string FriendPresencePathTemplate { get; set; } = "profiles/me/friends/presence";

    public string MessengerSendFriendRequestPathTemplate { get; set; } = "messenger/friendships";

    public string MessengerAcceptFriendRequestPathTemplate { get; set; } = "messenger/friendships/accept";

    public string MessengerRejectFriendRequestPathTemplate { get; set; } = "messenger/friendships/reject";

    public string MessengerUnfriendPathTemplate { get; set; } = "messenger/friendships";

    public string MessengerBlockUserPathTemplate { get; set; } = "messenger/friendships/block/{userId}";

    public string MessengerUnblockUserPathTemplate { get; set; } = "messenger/friendships/block/{userId}";

    public string MessengerBlockedUsersPathTemplate { get; set; } = "messenger/friendships/blocked-users";

    public string MessengerBlockedUserIdsPathTemplate { get; set; } = "messenger/friendships/blocked-user-ids";
}
