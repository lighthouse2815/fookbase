package com.dangngulon.frontend.feature.profile.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileDetail;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileSearchResult;

import java.util.concurrent.CompletableFuture;

public interface IUserProfileRepository {

    CompletableFuture<AppResult<UserProfileOverview>> getOverviewProfile();

    CompletableFuture<AppResult<UserProfileDetail>> getUserProfile(String userId);

    CompletableFuture<AppResult<UserProfileSearchResult>> searchUserProfileByPhoneNumber(String phoneNumber);
}
