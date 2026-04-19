package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

public class AddFriendProfileResponse {
    private String userId;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;

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
