package com.dangngulon.frontend.feature.profile.domain.model;

public class UserProfileSearchResult {
    private final String userId;
    private final String displayName;
    private final String phoneNumber;
    private final String avatarUrl;
    private final String status;

    public UserProfileSearchResult(
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
