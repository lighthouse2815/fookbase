package com.dangngulon.frontend.feature.zola.presentation.model;

public class AddFriendSearchResultUiModel {
    private final String userId;
    private final String displayName;
    private final String phoneNumber;
    private final String avatarUrl;
    private final String friendshipStatus;

    public AddFriendSearchResultUiModel(
            String userId,
            String displayName,
            String phoneNumber,
            String avatarUrl,
            String friendshipStatus
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
        this.friendshipStatus = friendshipStatus;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getFriendshipStatus() {
        return friendshipStatus;
    }
}
