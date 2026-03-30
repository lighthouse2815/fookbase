package com.dangngulon.frontend.viewmodel.zola;

import android.graphics.Bitmap;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.AddFriendUseCase;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class AddFriendViewModel extends ViewModel {
    private final Executor executor = Executors.newSingleThreadExecutor();

    private final AddFriendUseCase addFriendUseCase;

    private final MutableLiveData<Event<String>> _userId = new MutableLiveData<>();
    public LiveData<Event<String>> userId = _userId;

    private final MutableLiveData<Event<String>> _errorQr = new MutableLiveData<>();
    public LiveData<Event<String>> errorQr = _errorQr;

    private final MutableLiveData<Bitmap> qrBitmap = new MutableLiveData<>();

    private final MutableLiveData<Event<Result<FriendshipResponse>>> sendFriendRequestResult = new MutableLiveData<>();

    public LiveData<Bitmap> getQrBitmap() {
        return qrBitmap;
    }

    @Inject
    public AddFriendViewModel(AddFriendUseCase addFriendUseCase) {
        this.addFriendUseCase = addFriendUseCase;
    }

    public MutableLiveData<Event<Result<FriendshipResponse>>> getSendFriendRequestResult() {
        return sendFriendRequestResult;
    }

    public void handleQr(String content) {
        String id = addFriendUseCase.parseQrUserId(content);

        if(id == null){
            _errorQr.setValue(new Event<>("Mã QR không hợp lệ"));
            return;
        }

        _userId.setValue(new Event<>(id));
    }

    public void generateQrBitmap(String userId, int size) {
        executor.execute(() -> {
            Bitmap bitmap = addFriendUseCase.generateQrBitmap(userId,size);
            qrBitmap.postValue(bitmap);
        });
    }

    public void sendFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                sendFriendRequestResult,
                addFriendUseCase.sendFriendRequest(userId)
        );
    }
}
