package com.dangngulon.frontend.core.common.viewmodel.helpers;

import androidx.lifecycle.MutableLiveData;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import java.util.concurrent.CancellationException;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;

public class ViewModelHelper {

    private ViewModelHelper(){}

    public static <T> void callFuture(
            MutableLiveData<Result<T>> liveData,
            java.util.concurrent.CompletableFuture<AppResult<T>> future
    ) {

        liveData.postValue(Result.loading());
        if (future == null) {
            liveData.postValue(Result.error("Future is null"));
            return;
        }

        future.whenComplete((appResult, throwable) -> {
            if (throwable != null) {
                liveData.postValue(Result.error(toMessage(throwable)));
                return;
            }

            if (appResult == null) {
                liveData.postValue(Result.error("Empty result"));
                return;
            }

            if (appResult instanceof AppResult.Success<T> success) {

                liveData.postValue(
                        Result.success(success.getData())
                );

            } else if (appResult instanceof AppResult.Error<T> error) {

                liveData.postValue(
                        Result.error(toErrorMessage(error))
                );

            } else {
                liveData.postValue(Result.error("Unknown result state"));
            }

        });
    }

    public static <T> void callFutureEvent(
            MutableLiveData<Event<Result<T>>> liveData,
            java.util.concurrent.CompletableFuture<AppResult<T>> future
    ) {

        liveData.postValue(new Event<>(Result.loading()));
        if (future == null) {
            liveData.postValue(new Event<>(Result.error("Future is null")));
            return;
        }

        future.whenComplete((appResult, throwable) -> {
            if (throwable != null) {
                liveData.postValue(new Event<>(Result.error(toMessage(throwable))));
                return;
            }

            if (appResult == null) {
                liveData.postValue(new Event<>(Result.error("Empty result")));
                return;
            }

            if (appResult instanceof AppResult.Success<T> success) {

                liveData.postValue(
                        new Event<>(Result.success(success.getData()))
                );

            } else if (appResult instanceof AppResult.Error<T> error) {

                liveData.postValue(
                        new Event<>(Result.error(toErrorMessage(error)))
                );

            } else {
                liveData.postValue(new Event<>(Result.error("Unknown result state")));
            }

        });
    }

    private static String toMessage(Throwable throwable) {
        Throwable rootCause = unwrap(throwable);

        if (rootCause instanceof CancellationException) {
            return "Request cancelled";
        }

        String message = rootCause.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return "Unexpected error";
        }

        return message;
    }

    private static String toErrorMessage(AppResult.Error<?> error) {
        if (error == null || error.getError() == null) {
            return "Unexpected error";
        }

        String message = error.getError().getMessage();
        if (message == null || message.trim().isEmpty()) {
            return "Unexpected error";
        }

        return message;
    }

    private static Throwable unwrap(Throwable throwable) {
        Throwable current = throwable;
        while ((current instanceof CompletionException || current instanceof ExecutionException)
                && current.getCause() != null) {
            current = current.getCause();
        }

        return current;
    }

}

