package com.dangngulon.frontend.model.zola.response;

import java.time.LocalDateTime;

public class ConversationMemberResponse {

    private String userId;
    private String role;
    private String lastReadMessageId;
    private LocalDateTime joinedAt;
    private boolean outGroup;

    public ConversationMemberResponse() {
    }

    // Constructor đầy đủ
    public ConversationMemberResponse(
            String userId,
            String role,
            String lastReadMessageId,
            LocalDateTime joinedAt,
            boolean outGroup
    ) {
        this.userId = userId;
        this.role = role;
        this.lastReadMessageId = lastReadMessageId;
        this.joinedAt = joinedAt;
        this.outGroup = outGroup;
    }

    // Getter & Setter
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLastReadMessageId() {
        return lastReadMessageId;
    }

    public void setLastReadMessageId(String lastReadMessageId) {
        this.lastReadMessageId = lastReadMessageId;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isOutGroup() {
        return outGroup;
    }

    public void setOutGroup(boolean outGroup) {
        this.outGroup = outGroup;
    }
}

