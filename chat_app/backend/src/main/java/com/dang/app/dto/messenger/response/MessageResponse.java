package com.dang.app.dto.messenger.response;

import com.dang.app.utils.enums.MessageDeliveryStatus;
import com.dang.app.utils.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class MessageResponse {

    private UUID messageId;
    private UUID conversationId;

    private UUID senderId;

    private String senderName;
    private String content;

    private List<AttachmentResponse> attachments;

    private MessageDeliveryStatus status;
    private MessageType type;
    private Instant createdAt;       // ISO-8601
}
