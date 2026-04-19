package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

import java.time.LocalDateTime;

public class RecentUserChatResponse {
    private String userId;
    private String username;
    private String avatar;
    private LocalDateTime lastChatTime;

    public RecentUserChatResponse() {
    }

    public RecentUserChatResponse(String userId, String username, String avatar, LocalDateTime lastChatTime) {
        this.userId = userId;
        this.username = username;
        this.avatar = avatar;
        this.lastChatTime = lastChatTime;
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

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public LocalDateTime getLastChatTime() {
        return lastChatTime;
    }

    public void setLastChatTime(LocalDateTime lastChatTime) {
        this.lastChatTime = lastChatTime;
    }


}
