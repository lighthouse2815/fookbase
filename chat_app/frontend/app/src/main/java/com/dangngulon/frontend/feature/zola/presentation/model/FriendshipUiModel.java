package com.dangngulon.frontend.feature.zola.presentation.model;

import com.dangngulon.frontend.core.utils.enums.FriendshipStatus;

public class FriendshipUiModel {
    private String friendshipId;
    private String userId;
    private String username;
    private FriendshipStatus status;
    private String createdAt;
    private String updatedAt;

    public FriendshipUiModel() {
    }

    public FriendshipUiModel(
            String friendshipId,
            String userId,
            String username,
            FriendshipStatus status,
            String createdAt,
            String updatedAt
    ) {
        this.friendshipId = friendshipId;
        this.userId = userId;
        this.username = username;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getFriendshipId() {
        return friendshipId;
    }

    public void setFriendshipId(String friendshipId) {
        this.friendshipId = friendshipId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
