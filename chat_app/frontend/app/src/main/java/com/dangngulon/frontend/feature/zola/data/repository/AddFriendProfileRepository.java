package com.dangngulon.frontend.feature.zola.data.repository;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;
import com.dangngulon.frontend.feature.zola.data.mapper.AddFriendProfileDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.api.AddFriendProfileApi;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendProfileResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendSearchResponse;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class AddFriendProfileRepository implements IAddFriendProfileRepository {

    private final AddFriendProfileApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public AddFriendProfileRepository(AddFriendProfileApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<AddFriendSearchProfile>> searchUserProfileByPhoneNumber(String phoneNumber) {
        Call<AddFriendSearchResponse> call = api.searchUserProfileByPhoneNumber(phoneNumber);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(this::toSearchResult);
    }

    @Override
    public CompletableFuture<AppResult<AddFriendProfile>> getUserProfile(String userId) {
        Call<AddFriendProfileResponse> call = api.getUserProfile(userId);
        return RetrofitFutureAdapter.enqueue(call, errorMapper).thenApply(this::toProfileResult);
    }

    private AppResult<AddFriendSearchProfile> toSearchResult(AppResult<AddFriendSearchResponse> result) {
        if (result instanceof AppResult.Success<AddFriendSearchResponse> success) {
            return AppResult.success(AddFriendProfileDataMapper.toDomain(success.getData()));
        }

        if (result instanceof AppResult.Error<AddFriendSearchResponse> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected profile search result"));
    }

    private AppResult<AddFriendProfile> toProfileResult(AppResult<AddFriendProfileResponse> result) {
        if (result instanceof AppResult.Success<AddFriendProfileResponse> success) {
            return AppResult.success(AddFriendProfileDataMapper.toDomain(success.getData()));
        }

        if (result instanceof AppResult.Error<AddFriendProfileResponse> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected profile detail result"));
    }
}
