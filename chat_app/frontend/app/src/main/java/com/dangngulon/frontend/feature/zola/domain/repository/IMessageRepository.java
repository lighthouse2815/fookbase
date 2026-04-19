package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public interface IMessageRepository {

    CompletableFuture<AppResult<Message>> sendMessage(SendMessageCommand command);

    CompletableFuture<AppResult<MessageCursorPage>> getMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId,
            int limit
    );
}
