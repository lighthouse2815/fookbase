package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class FriendRequestUseCase {
    private final IFriendshipRepository friendshipRepository;

    @Inject
    public FriendRequestUseCase(IFriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    public CompletableFuture<AppResult<List<PendingFriendRequester>>> getPendingRequesters() {
        return friendshipRepository.getPendingRequesters();
    }

    public CompletableFuture<AppResult<Friendship>> acceptFriendRequest(String userId) {
        return friendshipRepository.acceptFriendRequest(new FriendshipCommand(userId));
    }

    public CompletableFuture<AppResult<Void>> rejectFriendRequest(String userId) {
        return friendshipRepository.rejectFriendRequest(new FriendshipCommand(userId));
    }
}
