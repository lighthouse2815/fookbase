package com.dangngulon.frontend.repository.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.FriendshipRequest;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface FriendshipRepository {
    CompletableFuture<AppResult<FriendshipResponse>> sendFriendRequest(FriendshipRequest request);

    CompletableFuture<AppResult<FriendshipResponse>> acceptFriendRequest(FriendshipRequest request);

    CompletableFuture<AppResult<Void>> rejectFriendRequest(FriendshipRequest request);

    CompletableFuture<AppResult<List<PendingFriendRequesterResponse>>> getPendingRequesters();
}
