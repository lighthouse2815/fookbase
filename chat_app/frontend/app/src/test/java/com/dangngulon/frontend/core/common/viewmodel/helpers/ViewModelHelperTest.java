package com.dangngulon.frontend.core.common.viewmodel.helpers;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.Observer;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import org.junit.Rule;
import org.junit.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ViewModelHelperTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

    @Test
    public void callFuture_whenFutureFails_postsErrorResult() throws InterruptedException {
        MutableLiveData<Result<String>> liveData = new MutableLiveData<>();
        CompletableFuture<AppResult<String>> future = new CompletableFuture<>();

        AtomicReference<Result<String>> latestResult = new AtomicReference<>();
        CountDownLatch errorLatch = new CountDownLatch(1);

        Observer<Result<String>> observer = result -> {
            latestResult.set(result);
            if (result != null && result.getStatus() == Result.Status.ERROR) {
                errorLatch.countDown();
            }
        };

        liveData.observeForever(observer);

        ViewModelHelper.callFuture(liveData, future);
        future.completeExceptionally(new RuntimeException("boom"));

        assertTrue(errorLatch.await(1, TimeUnit.SECONDS));
        assertEquals(Result.Status.ERROR, latestResult.get().getStatus());
        assertEquals("boom", latestResult.get().getMessage());

        liveData.removeObserver(observer);
    }

    @Test
    public void callFuture_whenFutureFailsWithCompletionException_unwrapsRootCause() throws InterruptedException {
        MutableLiveData<Result<String>> liveData = new MutableLiveData<>();
        CompletableFuture<AppResult<String>> future = new CompletableFuture<>();

        AtomicReference<Result<String>> latestResult = new AtomicReference<>();
        CountDownLatch errorLatch = new CountDownLatch(1);

        Observer<Result<String>> observer = result -> {
            latestResult.set(result);
            if (result != null && result.getStatus() == Result.Status.ERROR) {
                errorLatch.countDown();
            }
        };

        liveData.observeForever(observer);

        ViewModelHelper.callFuture(liveData, future);
        future.completeExceptionally(new CompletionException(new RuntimeException("deep-error")));

        assertTrue(errorLatch.await(1, TimeUnit.SECONDS));
        assertEquals(Result.Status.ERROR, latestResult.get().getStatus());
        assertEquals("deep-error", latestResult.get().getMessage());

        liveData.removeObserver(observer);
    }

    @Test
    public void callFuture_withEmptyAppErrorMessage_postsFallbackMessage() throws InterruptedException {
        MutableLiveData<Result<String>> liveData = new MutableLiveData<>();
        CompletableFuture<AppResult<String>> future = CompletableFuture.completedFuture(
                AppResult.error(new AppError("   "))
        );

        AtomicReference<Result<String>> latestResult = new AtomicReference<>();
        CountDownLatch errorLatch = new CountDownLatch(1);

        Observer<Result<String>> observer = result -> {
            latestResult.set(result);
            if (result != null && result.getStatus() == Result.Status.ERROR) {
                errorLatch.countDown();
            }
        };

        liveData.observeForever(observer);
        ViewModelHelper.callFuture(liveData, future);

        assertTrue(errorLatch.await(1, TimeUnit.SECONDS));
        assertEquals(Result.Status.ERROR, latestResult.get().getStatus());
        assertEquals("Unexpected error", latestResult.get().getMessage());

        liveData.removeObserver(observer);
    }

    @Test
    public void callFutureEvent_withNullFuture_postsErrorEvent() {
        MutableLiveData<Event<Result<String>>> liveData = new MutableLiveData<>();

        ViewModelHelper.callFutureEvent(liveData, null);

        Event<Result<String>> event = liveData.getValue();
        Result<String> result = event == null ? null : event.peekContent();
        assertEquals(Result.Status.ERROR, result.getStatus());
        assertEquals("Future is null", result.getMessage());
    }
}
