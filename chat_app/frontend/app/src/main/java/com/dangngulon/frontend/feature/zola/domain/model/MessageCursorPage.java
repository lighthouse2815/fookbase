package com.dangngulon.frontend.feature.zola.domain.model;

import java.util.List;

public class MessageCursorPage {
    private List<Message> messages;
    private MessageCursor nextCursor;

    public MessageCursorPage() {
    }

    public MessageCursorPage(List<Message> messages, MessageCursor nextCursor) {
        this.messages = messages;
        this.nextCursor = nextCursor;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    public MessageCursor getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(MessageCursor nextCursor) {
        this.nextCursor = nextCursor;
    }
}
