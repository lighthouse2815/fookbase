package com.dangngulon.frontend.repository.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.SendMessageRequest;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public interface MessageRepository {

    CompletableFuture<AppResult<MessageResponse>> sendMessage(SendMessageRequest request);

    CompletableFuture<AppResult<MessageCursorPageResponse>> getMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId,
            int limit
    );
}
