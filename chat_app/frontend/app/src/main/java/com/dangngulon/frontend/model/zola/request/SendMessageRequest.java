package com.dangngulon.frontend.model.zola.request;

import androidx.annotation.NonNull;

import java.util.List;

public class SendMessageRequest {
    @NonNull
    private String conversationId;
    
    private String content;
    
    private List<AttachmentRequest> attachments;

    public SendMessageRequest() {
    }

    public SendMessageRequest(@NonNull String conversationId, String content, List<AttachmentRequest> attachments) {
        this.conversationId = conversationId;
        this.content = content;
        this.attachments = attachments;
    }

    @NonNull
    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(@NonNull String conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<AttachmentRequest> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentRequest> attachments) {
        this.attachments = attachments;
    }
}
