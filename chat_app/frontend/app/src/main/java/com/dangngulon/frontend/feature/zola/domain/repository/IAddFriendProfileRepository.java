package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;

import java.util.concurrent.CompletableFuture;

public interface IAddFriendProfileRepository {

    CompletableFuture<AppResult<AddFriendSearchProfile>> searchUserProfileByPhoneNumber(String phoneNumber);

    CompletableFuture<AppResult<AddFriendProfile>> getUserProfile(String userId);
}
