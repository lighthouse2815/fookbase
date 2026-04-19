package com.dangngulon.frontend.feature.zola.data.repository;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.feature.zola.data.remote.api.FriendshipApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.data.mapper.FriendshipDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.FriendshipRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.FriendshipResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@Singleton
public class FriendshipRepository implements IFriendshipRepository {
    private final FriendshipApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public FriendshipRepository(FriendshipApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<Friendship>> sendFriendRequest(FriendshipCommand command) {
        FriendshipRequest request = FriendshipDataMapper.toRequest(command);
        Call<FriendshipResponse> call = api.sendFriendRequest(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<FriendshipResponse> success) {
                        return AppResult.success(FriendshipDataMapper.toDomain(success.getData()));
                    }

                    if (result instanceof AppResult.Error<FriendshipResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected send friend request result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<Friendship>> acceptFriendRequest(FriendshipCommand command) {
        FriendshipRequest request = FriendshipDataMapper.toRequest(command);
        Call<FriendshipResponse> call = api.acceptFriendRequest(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<FriendshipResponse> success) {
                        return AppResult.success(FriendshipDataMapper.toDomain(success.getData()));
                    }

                    if (result instanceof AppResult.Error<FriendshipResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected accept friend request result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<Void>> rejectFriendRequest(FriendshipCommand command) {
        FriendshipRequest request = FriendshipDataMapper.toRequest(command);
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
    public CompletableFuture<AppResult<List<PendingFriendRequester>>> getPendingRequesters() {
        Call<List<PendingFriendRequesterResponse>> call = api.getPendingRequesters();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<List<PendingFriendRequesterResponse>> success) {
                        return AppResult.success(FriendshipDataMapper.toDomainList(success.getData()));
                    }

                    if (result instanceof AppResult.Error<List<PendingFriendRequesterResponse>> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected pending requesters result"));
                });
    }
}
