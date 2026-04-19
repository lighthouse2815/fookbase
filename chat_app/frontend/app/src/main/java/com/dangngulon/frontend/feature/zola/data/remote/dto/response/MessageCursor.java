package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

import java.time.Instant;

public class MessageCursor {
    private Instant createdAt;
    private String messageId;

    public MessageCursor() {
    }

    public MessageCursor(Instant createdAt, String messageId) {
        this.createdAt = createdAt;
        this.messageId = messageId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }
}
