package com.dangngulon.frontend.feature.zola.domain.model;

public class FriendshipCommand {
    private String userId;

    public FriendshipCommand() {
    }

    public FriendshipCommand(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
