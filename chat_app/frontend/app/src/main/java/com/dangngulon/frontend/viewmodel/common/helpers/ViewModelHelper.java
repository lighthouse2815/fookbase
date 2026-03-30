package com.dangngulon.frontend.viewmodel.common.helpers;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.lifecycle.MutableLiveData;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ViewModelHelper {

    private ViewModelHelper(){}

    public static <T> void callFuture(
            MutableLiveData<Result<T>> liveData,
            java.util.concurrent.CompletableFuture<AppResult<T>> future
    ) {

        liveData.postValue(Result.loading());

        future.thenAccept(appResult -> {

            if (appResult instanceof AppResult.Success<T> success) {

                liveData.postValue(
                        Result.success(success.getData())
                );

            } else if (appResult instanceof AppResult.Error<T> error) {

                liveData.postValue(
                        Result.error(error.getError().getMessage())
                );

            }

        });
    }

    public static <T> void callFutureEvent(
            MutableLiveData<Event<Result<T>>> liveData,
            java.util.concurrent.CompletableFuture<AppResult<T>> future
    ) {

        liveData.postValue(new Event<>(Result.loading()));

        future.thenAccept(appResult -> {

            if (appResult instanceof AppResult.Success<T> success) {

                liveData.postValue(
                        new Event<>(Result.success(success.getData()))
                );

            } else if (appResult instanceof AppResult.Error<T> error) {

                liveData.postValue(
                        new Event<>(Result.error(error.getError().getMessage()))
                );

            }

        });
    }

}

