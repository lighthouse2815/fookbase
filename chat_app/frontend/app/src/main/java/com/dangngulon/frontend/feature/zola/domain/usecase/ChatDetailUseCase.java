package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.ChatDetailError;
import com.dangngulon.frontend.feature.zola.domain.model.AttachmentCommand;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;
import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

import javax.inject.Inject;

public class ChatDetailUseCase {
    private final IMessageRepository messageRepository;
    private final IChatRepository repository;

    @Inject
    public ChatDetailUseCase(IMessageRepository messageRepository, IChatRepository repository) {
        this.messageRepository = messageRepository;
        this.repository = repository;
    }

    public AppResult<Void> sendRealTime(
            String conversationId,
            String content,
            List<AttachmentCommand> attachments
    ) {
        if (conversationId == null) {
            return AppResult.error(new AppError(ChatDetailError.INVALID_INPUT.name()));
        }

        if ((content == null || content.trim().isEmpty())
                && (attachments == null || attachments.isEmpty())) {

            return AppResult.error(new AppError(ChatDetailError.EMPTY_CONTENT.name()));
        }

        SendMessageCommand command = new SendMessageCommand(conversationId, content, attachments);
        repository.sendMessage(command);

        return AppResult.success(null);
    }

    public Runnable subscribeMessages(
            String conversationId,
            Consumer<Message> onMessage
    ) {
        return repository.subscribeMessages(conversationId, onMessage);
    }

    public CompletableFuture<AppResult<Message>> sendMessage(
            String conversationId,
            String content,
            List<AttachmentCommand> attachments
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


        SendMessageCommand command = new SendMessageCommand(conversationId, content, attachments);
        return messageRepository.sendMessage(command);
    }

    public CompletableFuture<AppResult<MessageCursorPage>> getMessages(
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

    public CompletableFuture<AppResult<MessageCursorPage>> loadInitialMessages(String conversationId) {
        return getMessages(conversationId, null, null, 20);
    }

    public CompletableFuture<AppResult<MessageCursorPage>> loadMoreMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId
    ) {
        return getMessages(conversationId, cursorCreatedAt, cursorMessageId, 20);
    }
}
