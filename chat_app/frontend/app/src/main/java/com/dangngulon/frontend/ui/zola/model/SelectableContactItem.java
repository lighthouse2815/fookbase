package com.dangngulon.frontend.ui.zola.model;

import java.time.LocalDateTime;

public class SelectableContactItem {
    private String userId;
    private String username;
    private String avatar;
    private String phoneNumber;
    private LocalDateTime lastChatTime; // nullable

    public SelectableContactItem(
            String userId,
            String username,
            String avatar,
            String phoneNumber,
            LocalDateTime lastChatTime
    ) {
        this.userId = userId;
        this.username = username;
        this.avatar = avatar;
        this.phoneNumber = phoneNumber;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public LocalDateTime getLastChatTime() {
        return lastChatTime;
    }

    public void setLastChatTime(LocalDateTime lastChatTime) {
        this.lastChatTime = lastChatTime;
    }
}
