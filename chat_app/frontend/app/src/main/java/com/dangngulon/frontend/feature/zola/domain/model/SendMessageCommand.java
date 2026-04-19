package com.dangngulon.frontend.feature.zola.domain.model;

import java.util.List;

public class SendMessageCommand {
    private String conversationId;
    private String content;
    private List<AttachmentCommand> attachments;

    public SendMessageCommand() {
    }

    public SendMessageCommand(String conversationId, String content, List<AttachmentCommand> attachments) {
        this.conversationId = conversationId;
        this.content = content;
        this.attachments = attachments;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<AttachmentCommand> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentCommand> attachments) {
        this.attachments = attachments;
    }
}
