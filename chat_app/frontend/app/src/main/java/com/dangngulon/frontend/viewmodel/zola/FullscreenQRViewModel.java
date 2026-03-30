package com.dangngulon.frontend.viewmodel.zola;

import android.app.Application;
import android.graphics.Bitmap;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.MutableLiveData;

import com.dangngulon.frontend.domain.usecase.zola.FullscreenQRUseCase;
import com.dangngulon.frontend.utils.others.Event;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class FullscreenQRViewModel extends AndroidViewModel {

    private final FullscreenQRUseCase fullscreenQRUseCase;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final MutableLiveData<Event<Boolean>> saveResult = new MutableLiveData<>();

    public MutableLiveData<Event<Boolean>> getSaveResult() {
        return saveResult;
    }

    @Inject
    public FullscreenQRViewModel(
            @NonNull Application application,
            FullscreenQRUseCase fullscreenQRUseCase
    ) {
        super(application);
        this.fullscreenQRUseCase = fullscreenQRUseCase;
    }

    public void saveQr(Bitmap bitmap) {
        executor.execute(() -> {
            boolean result = fullscreenQRUseCase.execute(getApplication(), bitmap);
            saveResult.postValue(new Event<>(result));
        });
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        executor.shutdown();
    }
}
