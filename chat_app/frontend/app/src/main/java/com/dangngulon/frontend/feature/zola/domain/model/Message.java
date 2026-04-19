package com.dangngulon.frontend.feature.zola.domain.model;

import com.dangngulon.frontend.core.utils.enums.MessageDeliveryStatus;
import com.dangngulon.frontend.core.utils.enums.MessageType;

import java.util.List;

public class Message {
    private String messageId;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private List<Attachment> attachments;
    private MessageDeliveryStatus status;
    private MessageType type;
    private String createdAt;

    public Message() {
    }

    public Message(
            String messageId,
            String conversationId,
            String senderId,
            String senderName,
            String content,
            List<Attachment> attachments,
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

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
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
