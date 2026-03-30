package com.dangngulon.frontend.repository.auth;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.auth.request.UserProfileRequest;
import com.dangngulon.frontend.model.auth.request.UserProfileSearchRequest;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;

import java.util.concurrent.CompletableFuture;

public interface UserProfileRepository {

    CompletableFuture<AppResult<UserProfileOverviewResponse>> getOverviewProfile();

    CompletableFuture<AppResult<UserProfileResponse>> getUserProfile(UserProfileRequest request);

    CompletableFuture<AppResult<UserProfileSearchResponse>> searchUserProfileByPhoneNumber(UserProfileSearchRequest request);
}