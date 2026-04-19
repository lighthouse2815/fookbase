package com.dangngulon.frontend.feature.zola.data.remote.dto.request;

public class FriendshipRequest {

    private String userId;

    public FriendshipRequest() {
    }

    public FriendshipRequest(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
