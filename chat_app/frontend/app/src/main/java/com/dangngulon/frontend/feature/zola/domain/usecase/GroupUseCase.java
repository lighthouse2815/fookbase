package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class GroupUseCase {
    private final IConversationRepository repository;

    @Inject
    public GroupUseCase(IConversationRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<List<Conversation>>> getAllGroups() {
        return repository.getAllGroups();
    }
}
