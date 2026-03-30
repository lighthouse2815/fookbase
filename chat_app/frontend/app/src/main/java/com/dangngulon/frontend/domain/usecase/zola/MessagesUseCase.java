package com.dangngulon.frontend.domain.usecase.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.repository.zola.ConversationRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class MessagesUseCase {
    private final ConversationRepository repository;

    @Inject
    public MessagesUseCase(ConversationRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<List<ConversationResponse>>> getAllConversations() {
        return repository.getAllConversations();
    }

}
