package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

import java.util.List;

public class MessageCursorPageResponse {
    private List<MessageResponse> messages;
    private MessageCursor nextCursor;

    public MessageCursorPageResponse() {
    }

    public MessageCursorPageResponse(List<MessageResponse> messages, MessageCursor nextCursor) {
        this.messages = messages;
        this.nextCursor = nextCursor;
    }

    public List<MessageResponse> getMessages() {
        return messages;
    }

    public void setMessages(List<MessageResponse> messages) {
        this.messages = messages;
    }

    public MessageCursor getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(MessageCursor nextCursor) {
        this.nextCursor = nextCursor;
    }
}
