package com.dangngulon.frontend.feature.profile.data.repository;

import com.dangngulon.frontend.feature.profile.data.remote.api.UserProfileApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileDetail;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileSearchResult;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileSearchResponse;
import com.dangngulon.frontend.feature.profile.domain.repository.IUserProfileRepository;
import com.dangngulon.frontend.feature.profile.data.mapper.UserProfileResponseMapper;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class UserProfileRepository implements IUserProfileRepository {

    private final UserProfileApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public UserProfileRepository(UserProfileApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<UserProfileOverview>> getOverviewProfile() {
        Call<UserProfileOverviewResponse> call = api.getOverviewProfile();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<UserProfileOverviewResponse> success) {
                        return AppResult.success(
                                UserProfileResponseMapper.toOverview(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<UserProfileOverviewResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected get overview profile result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<UserProfileDetail>> getUserProfile(String userId) {
        Call<UserProfileResponse> call = api.getUserProfile(userId);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<UserProfileResponse> success) {
                        return AppResult.success(
                                UserProfileResponseMapper.toDetail(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<UserProfileResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected get user profile result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<UserProfileSearchResult>> searchUserProfileByPhoneNumber(String phoneNumber) {
        Call<UserProfileSearchResponse> call = api.searchUserProfileByPhoneNumber(phoneNumber);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<UserProfileSearchResponse> success) {
                        return AppResult.success(
                                UserProfileResponseMapper.toSearchResult(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<UserProfileSearchResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected search user profile result"));
                });
    }

}
