package com.dangngulon.frontend.domain.usecase.zola;

import androidx.lifecycle.LiveData;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.domain.common.errors.ChatDetailError;
import com.dangngulon.frontend.model.zola.request.AttachmentRequest;
import com.dangngulon.frontend.model.zola.request.SendMessageRequest;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.repository.zola.ChatRepository;
import com.dangngulon.frontend.repository.zola.MessageRepository;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class ChatDetailUseCase {
    private final MessageRepository messageRepository;
    private final ChatRepository repository;

    @Inject
    public ChatDetailUseCase(MessageRepository messageRepository, ChatRepository repository) {
        this.messageRepository = messageRepository;
        this.repository = repository;
    }

    public AppResult<Void> sendRealTime(
            String conversationId,
            String content,
            List<AttachmentRequest> attachments
    ) {
        if (conversationId == null) {
            return AppResult.error(new AppError(ChatDetailError.INVALID_INPUT.name()));
        }

        if ((content == null || content.trim().isEmpty())
                && (attachments == null || attachments.isEmpty())) {

            return AppResult.error(new AppError(ChatDetailError.EMPTY_CONTENT.name()));
        }

        SendMessageRequest request = new SendMessageRequest(conversationId, content, attachments);

        repository.sendMessage(request);

        return AppResult.success(null);
    }

    public LiveData<MessageResponse> SubscribeMessages(String conversationId, String userId) {
        return repository.subscribeMessages(conversationId, userId);
    }

    public CompletableFuture<AppResult<MessageResponse>> sendMessage(
            String conversationId,
            String content,
            List<AttachmentRequest> attachments
    ) {
        if (conversationId == null) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ChatDetailError.INVALID_INPUT.name()))
            );
        }

        if ((content == null || content.trim().isEmpty()) && (attachments == null || attachments.isEmpty())) {
                return CompletableFuture.completedFuture(
                        AppResult.error(new AppError(ChatDetailError.EMPTY_CONTENT.name()))
                );
            }


        SendMessageRequest request = new SendMessageRequest(conversationId, content, attachments);
        return messageRepository.sendMessage(request);
    }

    public CompletableFuture<AppResult<MessageCursorPageResponse>> getMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId,
            int limit
    ) {
        if (conversationId == null) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ChatDetailError.INVALID_INPUT.name()))
            );
        }

        if (limit <= 0 || limit > 100) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ChatDetailError.INVALID_LIMIT.name()))
            );
        }

        return messageRepository.getMessages(conversationId, cursorCreatedAt, cursorMessageId, limit);
    }

    public CompletableFuture<AppResult<MessageCursorPageResponse>> loadInitialMessages(String conversationId) {
        return getMessages(conversationId, null, null, 20);
    }

    public CompletableFuture<AppResult<MessageCursorPageResponse>> loadMoreMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId
    ) {
        return getMessages(conversationId, cursorCreatedAt, cursorMessageId, 20);
    }
}
