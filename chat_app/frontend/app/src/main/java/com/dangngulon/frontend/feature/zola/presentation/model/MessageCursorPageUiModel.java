package com.dangngulon.frontend.feature.zola.presentation.model;

import java.util.List;

public class MessageCursorPageUiModel {
    private List<MessageUiModel> messages;
    private MessageCursorUiModel nextCursor;

    public MessageCursorPageUiModel() {
    }

    public MessageCursorPageUiModel(List<MessageUiModel> messages, MessageCursorUiModel nextCursor) {
        this.messages = messages;
        this.nextCursor = nextCursor;
    }

    public List<MessageUiModel> getMessages() {
        return messages;
    }

    public void setMessages(List<MessageUiModel> messages) {
        this.messages = messages;
    }

    public MessageCursorUiModel getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(MessageCursorUiModel nextCursor) {
        this.nextCursor = nextCursor;
    }
}
