package com.dangngulon.frontend.feature.zola.presentation.model;

public class AddFriendProfileUiModel {
    private final String userId;
    private final String displayName;
    private final String avatarUrl;
    private final String phoneNumber;

    public AddFriendProfileUiModel(
            String userId,
            String displayName,
            String avatarUrl,
            String phoneNumber
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.phoneNumber = phoneNumber;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }
}
