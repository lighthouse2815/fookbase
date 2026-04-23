package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class MessagesUseCase {
    private final IConversationRepository repository;
    private final IMessageRepository messageRepository;

    @Inject
    public MessagesUseCase(IConversationRepository repository, IMessageRepository messageRepository) {
        this.repository = repository;
        this.messageRepository = messageRepository;
    }

    public CompletableFuture<AppResult<List<Conversation>>> getAllConversations() {
        return repository.getAllConversations()
                .thenCompose(result -> {
                    if (result instanceof AppResult.Success<List<Conversation>> success) {
                        List<Conversation> conversations = success.getData();
                        return enrichConversationsWithLatestMessages(conversations)
                                .thenApply(unused -> AppResult.success(conversations));
                    }

                    if (result instanceof AppResult.Error<List<Conversation>> error) {
                        return CompletableFuture.completedFuture(AppResult.error(error.getError()));
                    }

                    return CompletableFuture.completedFuture(
                            AppResult.error(new AppError("Unexpected conversations result"))
                    );
                });
    }

    private CompletableFuture<Void> enrichConversationsWithLatestMessages(List<Conversation> conversations) {
        if (conversations == null || conversations.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }

        CompletableFuture<?>[] tasks = conversations.stream()
                .filter(Objects::nonNull)
                .map(this::enrichConversationWithLatestMessage)
                .toArray(CompletableFuture[]::new);

        if (tasks.length == 0) {
            return CompletableFuture.completedFuture(null);
        }

        return CompletableFuture.allOf(tasks);
    }

    private CompletableFuture<Void> enrichConversationWithLatestMessage(Conversation conversation) {
        String conversationId = conversation.getConversationId();
        if (!hasText(conversationId)) {
            return CompletableFuture.completedFuture(null);
        }

        return messageRepository.getMessages(conversationId, null, null, 1)
                .thenAccept(result -> {
                    if (!(result instanceof AppResult.Success<MessageCursorPage> success)) {
                        return;
                    }

                    MessageCursorPage page = success.getData();
                    if (page == null || page.getMessages() == null || page.getMessages().isEmpty()) {
                        return;
                    }

                    Message latestMessage = page.getMessages().get(0);
                    if (latestMessage == null) {
                        return;
                    }

                    if (hasText(latestMessage.getCreatedAt())) {
                        conversation.setLastMessageAt(latestMessage.getCreatedAt());
                    }

                    if (hasText(latestMessage.getSenderId())) {
                        conversation.setLastSenderId(latestMessage.getSenderId());
                    }

                    if (hasText(latestMessage.getSenderName())) {
                        conversation.setLastSenderName(latestMessage.getSenderName());
                    }

                    if (hasText(latestMessage.getContent())) {
                        conversation.setLastMessagePreview(latestMessage.getContent().trim());
                    }
                })
                .exceptionally(throwable -> null);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
