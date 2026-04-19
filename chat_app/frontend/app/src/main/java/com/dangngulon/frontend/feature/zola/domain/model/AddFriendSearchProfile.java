package com.dangngulon.frontend.feature.zola.domain.model;

public class AddFriendSearchProfile {
    private String userId;
    private String displayName;
    private String phoneNumber;
    private String avatarUrl;
    private String status;

    public AddFriendSearchProfile() {
    }

    public AddFriendSearchProfile(
            String userId,
            String displayName,
            String phoneNumber,
            String avatarUrl,
            String status
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
        this.status = status;
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

    public String getStatus() {
        return status;
    }
}
