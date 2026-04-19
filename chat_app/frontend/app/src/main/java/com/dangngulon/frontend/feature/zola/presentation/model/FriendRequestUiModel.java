package com.dangngulon.frontend.feature.zola.presentation.model;

public class FriendRequestUiModel {
    private String userId;
    private String displayName;
    private String avatarUrl;
    private boolean requester;
    private String createdAt;

    public FriendRequestUiModel() {
    }

    public FriendRequestUiModel(
            String userId,
            String displayName,
            String avatarUrl,
            boolean requester,
            String createdAt
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.requester = requester;
        this.createdAt = createdAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isRequester() {
        return requester;
    }

    public void setRequester(boolean requester) {
        this.requester = requester;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
