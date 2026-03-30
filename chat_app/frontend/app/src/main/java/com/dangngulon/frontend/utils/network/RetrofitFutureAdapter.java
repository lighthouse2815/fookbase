package com.dangngulon.frontend.utils.network;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.concurrent.CompletableFuture;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public final class RetrofitFutureAdapter {

    private RetrofitFutureAdapter() {}

    // Alias để match naming trong guideline PR: enqueue(call, mapper)
    @NonNull
    public static <T> CompletableFuture<AppResult<T>> enqueue(
            @NonNull Call<T> call,
            @NonNull ApiErrorMapper mapper
    ) {
        return adapt(call, mapper);
    }

    @NonNull
    public static <T> CompletableFuture<AppResult<T>> adapt(
            @NonNull Call<T> call,
            @NonNull ApiErrorMapper mapper
    ) {
        CompletableFuture<AppResult<T>> future = new CompletableFuture<>() {
            @Override
            public boolean cancel(boolean mayInterruptIfRunning) {
                call.cancel(); // nice-to-have: cancel retrofit call when future cancelled
                return super.cancel(mayInterruptIfRunning);
            }
        };

        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<T> c, @NonNull Response<T> response) {
                if (future.isDone()) return;

                if (response.isSuccessful()) {
                    T body = response.body();
                    if (body != null) {
                        future.complete(AppResult.success(body));
                    } else {
                        future.complete(AppResult.error("Empty body", response.code(), null));
                    }
                } else {
                    AppError appError = mapper.toAppError(response);
                    future.complete(AppResult.error(appError));
                }
            }

            @Override
            public void onFailure(@NonNull Call<T> c, @NonNull Throwable t) {
                if (future.isDone()) return;
                if (c.isCanceled()) {
                    future.cancel(false);
                    return;
                }

                // Handling rules: timeout/no internet -> "Network error"
                if (t instanceof SocketTimeoutException
                        || t instanceof UnknownHostException
                        || t instanceof IOException) {
                    future.complete(AppResult.error("Network error", null, t));
                    return;
                }

                // fallback: delegate message to mapper
                AppError appError = mapper.toAppError(t);
                future.complete(AppResult.error(appError));
            }
        });

        return future;
    }
}
