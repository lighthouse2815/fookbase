package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;

import java.util.function.Consumer;

public interface IChatRepository {
    Runnable subscribeMessages(
            String conversationId,
            Consumer<Message> onMessage
    );

    void sendMessage(SendMessageCommand command);
}
