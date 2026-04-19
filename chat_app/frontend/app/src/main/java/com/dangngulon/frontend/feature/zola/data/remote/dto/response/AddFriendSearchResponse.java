package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

public class AddFriendSearchResponse {
    private String userId;
    private String displayName;
    private String phoneNumber;
    private String avatarUrl;
    private String status;

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
