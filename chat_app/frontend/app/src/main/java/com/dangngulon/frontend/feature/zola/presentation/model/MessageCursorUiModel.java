package com.dangngulon.frontend.feature.zola.presentation.model;

import java.time.Instant;

public class MessageCursorUiModel {
    private Instant createdAt;
    private String messageId;

    public MessageCursorUiModel() {
    }

    public MessageCursorUiModel(Instant createdAt, String messageId) {
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
