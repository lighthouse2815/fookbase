package com.dangngulon.frontend.repository.auth_impl;

import com.dangngulon.frontend.api.auth.UserProfileApi;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.auth.request.UserProfileRequest;
import com.dangngulon.frontend.model.auth.request.UserProfileSearchRequest;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;
import com.dangngulon.frontend.repository.auth.UserProfileRepository;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class UserProfileRepositoryImpl implements UserProfileRepository {

    private final UserProfileApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public UserProfileRepositoryImpl(UserProfileApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<UserProfileOverviewResponse>> getOverviewProfile() {
        Call<UserProfileOverviewResponse> call = api.getOverviewProfile();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<UserProfileResponse>> getUserProfile(UserProfileRequest request) {
        Call<UserProfileResponse> call = api.getUserProfile(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<UserProfileSearchResponse>> searchUserProfileByPhoneNumber(UserProfileSearchRequest request) {
        Call<UserProfileSearchResponse> call = api.searchUserProfileByPhoneNumber(request.getPhoneNumber());
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

}