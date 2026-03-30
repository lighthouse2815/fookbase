package com.dangngulon.frontend.repository.zola_impl;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.api.zola.FriendShipApi;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.FriendshipRequest;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.repository.zola.FriendshipRepository;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@Singleton
public class FriendshipRepositoryImpl implements FriendshipRepository {
    private final FriendShipApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public FriendshipRepositoryImpl(FriendShipApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<FriendshipResponse>> sendFriendRequest(FriendshipRequest request) {
        Call<FriendshipResponse> call = api.sendFriendRequest(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<FriendshipResponse>> acceptFriendRequest(FriendshipRequest request) {
        Call<FriendshipResponse> call = api.acceptFriendRequest(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<Void>> rejectFriendRequest(FriendshipRequest request) {
        Call<Void> call = api.rejectFriendRequest(request);
        CompletableFuture<AppResult<Void>> future = new CompletableFuture<>();

        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<Void> c, @NonNull Response<Void> response) {
                if (future.isDone()) {
                    return;
                }

                if (response.isSuccessful()) {
                    future.complete(AppResult.success(null));
                    return;
                }

                future.complete(AppResult.error(errorMapper.toAppError(response)));
            }

            @Override
            public void onFailure(@NonNull Call<Void> c, @NonNull Throwable t) {
                if (future.isDone()) {
                    return;
                }

                if (c.isCanceled()) {
                    future.cancel(false);
                    return;
                }

                future.complete(AppResult.error(errorMapper.toAppError(t)));
            }
        });

        return future;
    }

    @Override
    public CompletableFuture<AppResult<List<PendingFriendRequesterResponse>>> getPendingRequesters() {
        Call<List<PendingFriendRequesterResponse>> call = api.getPendingRequesters();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }
}
