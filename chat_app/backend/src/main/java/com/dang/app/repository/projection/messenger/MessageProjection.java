package com.dang.app.repository.projection.messenger;

import com.dang.app.dto.messenger.response.AttachmentResponse;
import com.dang.app.utils.enums.MessageDeliveryStatus;
import com.dang.app.utils.enums.MessageType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

public interface MessageProjection {

    UUID getMessageId();
    UUID getConversationId();

    UUID getSenderId();

    String getSenderName();
    String getContent();

    MessageDeliveryStatus getStatus();
    MessageType getType();
    LocalDateTime getCreatedAtRaw();

    default List<AttachmentResponse> getAttachments() {
        return List.of();
    }

    default Instant getCreatedAt() {
        LocalDateTime createdAt = getCreatedAtRaw();
        return createdAt == null ? null : createdAt.toInstant(ZoneOffset.UTC);
    }
}
