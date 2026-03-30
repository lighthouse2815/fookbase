package com.dangngulon.frontend.domain.usecase.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.FriendshipRequest;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.repository.zola.FriendshipRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class FriendRequestUseCase {
    private final FriendshipRepository friendshipRepository;

    @Inject
    public FriendRequestUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    public CompletableFuture<AppResult<List<PendingFriendRequesterResponse>>> getPendingRequesters() {
        return friendshipRepository.getPendingRequesters();
    }

    public CompletableFuture<AppResult<FriendshipResponse>> acceptFriendRequest(String userId) {
        return friendshipRepository.acceptFriendRequest(new FriendshipRequest(userId));
    }

    public CompletableFuture<AppResult<Void>> rejectFriendRequest(String userId) {
        return friendshipRepository.rejectFriendRequest(new FriendshipRequest(userId));
    }
}
