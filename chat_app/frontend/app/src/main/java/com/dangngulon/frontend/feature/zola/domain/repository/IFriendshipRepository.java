package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface IFriendshipRepository {
    CompletableFuture<AppResult<Friendship>> sendFriendRequest(FriendshipCommand command);

    CompletableFuture<AppResult<Friendship>> acceptFriendRequest(FriendshipCommand command);

    CompletableFuture<AppResult<Void>> rejectFriendRequest(FriendshipCommand command);

    CompletableFuture<AppResult<List<PendingFriendRequester>>> getPendingRequesters();
}
