package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.AttachmentResponse;
import com.dang.app.dto.messenger.response.MessageResponse;
import com.dang.app.entity.messenger.Message;
import com.dang.app.repository.projection.messenger.MessageProjection;
import com.dang.app.utils.enums.MessageDeliveryStatus;
import com.dang.app.utils.enums.MessageType;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

@Component
public class MessageMapper {

    private final AttachmentMapper attachmentMapper;

    public MessageMapper(AttachmentMapper attachmentMapper) {
        this.attachmentMapper = attachmentMapper;
    }

    public MessageResponse toMessageResponse(Message message) {
        return toMessageResponse(message, mapAttachments(message));
    }

    public MessageResponse toMessageResponse(Message message, List<AttachmentResponse> attachments) {
        if (message == null) {
            return null;
        }

        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getUsername(),
                message.getContent(),
                attachments == null ? List.of() : attachments,
                MessageDeliveryStatus.SENT,
                message.getType() == null ? MessageType.TEXT : message.getType(),
                toInstant(message)
        );
    }

    public MessageResponse toMessageResponse(MessageProjection projection, List<AttachmentResponse> attachments) {
        if (projection == null) {
            return null;
        }

        return new MessageResponse(
                projection.getMessageId(),
                projection.getConversationId(),
                projection.getSenderId(),
                projection.getSenderName(),
                projection.getContent(),
                attachments == null ? List.of() : attachments,
                projection.getStatus(),
                projection.getType() == null ? MessageType.TEXT : projection.getType(),
                projection.getCreatedAt()
        );
    }

    private List<AttachmentResponse> mapAttachments(Message message) {
        if (message.getAttachments() == null || message.getAttachments().isEmpty()) {
            return List.of();
        }

        return message.getAttachments().stream()
                .map(attachmentMapper::toAttachmentResponse)
                .toList();
    }

    private Instant toInstant(Message message) {
        if (message.getCreatedAt() == null) {
            return null;
        }

        return message.getCreatedAt()
                .atZone(ZoneOffset.UTC)
                .toInstant();
    }
}
