package com.dangngulon.frontend.feature.profile.data.remote.dto.request;

public class UserProfileRequest {
    private String userId;

    public UserProfileRequest() {}

    public UserProfileRequest(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
