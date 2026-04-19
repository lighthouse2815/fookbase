package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import android.graphics.Bitmap;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.feature.zola.domain.usecase.FullscreenQRUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;

import java.io.ByteArrayOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class FullscreenQRViewModel extends ViewModel {

    private final FullscreenQRUseCase fullscreenQRUseCase;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final MutableLiveData<Event<Boolean>> saveResult = new MutableLiveData<>();

    public LiveData<Event<Boolean>> getSaveResult() {
        return saveResult;
    }

    @Inject
    public FullscreenQRViewModel(FullscreenQRUseCase fullscreenQRUseCase) {
        this.fullscreenQRUseCase = fullscreenQRUseCase;
    }

    public void saveQr(Bitmap bitmap) {
        if (bitmap == null) {
            saveResult.setValue(new Event<>(false));
            return;
        }

        executor.execute(() -> {
            byte[] imageData = toPngBytes(bitmap);
            boolean result = fullscreenQRUseCase.execute(imageData, "QR");
            saveResult.postValue(new Event<>(result));
        });
    }

    private byte[] toPngBytes(Bitmap bitmap) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            boolean compressed = bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
            if (!compressed) {
                return null;
            }
            return outputStream.toByteArray();
        } catch (Exception exception) {
            return null;
        }
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        executor.shutdown();
    }
}
