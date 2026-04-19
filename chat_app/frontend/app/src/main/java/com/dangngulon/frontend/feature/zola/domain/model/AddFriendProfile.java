package com.dangngulon.frontend.feature.zola.domain.model;

public class AddFriendProfile {
    private String userId;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;

    public AddFriendProfile() {
    }

    public AddFriendProfile(String userId, String displayName, String avatarUrl, String phoneNumber) {
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
