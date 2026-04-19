package com.dangngulon.frontend.feature.zola.presentation.model;

import com.dangngulon.frontend.core.utils.enums.MessageDeliveryStatus;
import com.dangngulon.frontend.core.utils.enums.MessageType;

import java.util.List;

public class MessageUiModel {
    private String messageId;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private List<AttachmentUiModel> attachments;
    private MessageDeliveryStatus status;
    private MessageType type;
    private String createdAt;

    public MessageUiModel() {
    }

    public MessageUiModel(
            String messageId,
            String conversationId,
            String senderId,
            String senderName,
            String content,
            List<AttachmentUiModel> attachments,
            MessageDeliveryStatus status,
            MessageType type,
            String createdAt
    ) {
        this.messageId = messageId;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.attachments = attachments;
        this.status = status;
        this.type = type;
        this.createdAt = createdAt;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<AttachmentUiModel> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentUiModel> attachments) {
        this.attachments = attachments;
    }

    public MessageDeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(MessageDeliveryStatus status) {
        this.status = status;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
