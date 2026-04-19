package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import android.graphics.Bitmap;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.utils.qr.QrUtils;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;
import com.dangngulon.frontend.feature.zola.domain.usecase.AddFriendUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.AddFriendProfileUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.AddFriendSearchResultUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendshipUiModel;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class AddFriendViewModel extends ViewModel {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AddFriendUseCase addFriendUseCase;
    private final UserSessionUseCase userSessionUseCase;

    private final MutableLiveData<Event<String>> userIdEvent = new MutableLiveData<>();
    private final MutableLiveData<Event<String>> errorQrEvent = new MutableLiveData<>();
    private final MutableLiveData<Bitmap> qrBitmap = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<FriendshipUiModel>>> sendFriendRequestResult =
            new MutableLiveData<>();
    private final MutableLiveData<Event<Result<AddFriendSearchResultUiModel>>> searchProfileResult =
            new MutableLiveData<>();
    private final MutableLiveData<Event<Result<AddFriendProfileUiModel>>> userProfileResult =
            new MutableLiveData<>();

    @Inject
    public AddFriendViewModel(
            AddFriendUseCase addFriendUseCase,
            UserSessionUseCase userSessionUseCase
    ) {
        this.addFriendUseCase = addFriendUseCase;
        this.userSessionUseCase = userSessionUseCase;
    }

    public LiveData<Event<String>> getUserIdEvent() {
        return userIdEvent;
    }

    public LiveData<Event<String>> getErrorQrEvent() {
        return errorQrEvent;
    }

    public LiveData<Bitmap> getQrBitmap() {
        return qrBitmap;
    }

    public LiveData<Event<Result<FriendshipUiModel>>> getSendFriendRequestResult() {
        return sendFriendRequestResult;
    }

    public LiveData<Event<Result<AddFriendSearchResultUiModel>>> getSearchProfileResult() {
        return searchProfileResult;
    }

    public LiveData<Event<Result<AddFriendProfileUiModel>>> getUserProfileResult() {
        return userProfileResult;
    }

    public void handleQr(String content) {
        String id = addFriendUseCase.parseQrUserId(content);
        if (id == null) {
            errorQrEvent.setValue(new Event<>("Ma QR khong hop le"));
            return;
        }

        userIdEvent.setValue(new Event<>(id));
    }

    public String getCurrentUserId() {
        return userSessionUseCase.getCurrentUserId();
    }

    public String getCurrentDisplayName() {
        return userSessionUseCase.getCurrentDisplayName();
    }

    public void generateMyQrBitmap(int size) {
        generateQrBitmap(getCurrentUserId(), size);
    }

    public void generateQrBitmap(String userId, int size) {
        executor.execute(() -> {
            String qrContent = addFriendUseCase.buildQrContent(userId);
            if (qrContent == null) {
                errorQrEvent.postValue(new Event<>("Khong tao duoc ma QR"));
                qrBitmap.postValue(null);
                return;
            }

            Bitmap bitmap = QrUtils.generateQr(qrContent, size);
            if (bitmap == null) {
                errorQrEvent.postValue(new Event<>("Khong tao duoc ma QR"));
            }
            qrBitmap.postValue(bitmap);
        });
    }

    public void sendFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                sendFriendRequestResult,
                addFriendUseCase.sendFriendRequest(userId).thenApply(this::toFriendshipUiResult)
        );
    }

    public void searchUserProfileByPhoneNumber(String phoneNumber) {
        ViewModelHelper.callFutureEvent(
                searchProfileResult,
                addFriendUseCase
                        .searchUserProfileByPhoneNumber(phoneNumber)
                        .thenApply(this::toSearchUiResult)
        );
    }

    public void getUserProfile(String userId) {
        ViewModelHelper.callFutureEvent(
                userProfileResult,
                addFriendUseCase.getUserProfile(userId).thenApply(this::toProfileUiResult)
        );
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        executor.shutdown();
    }

    private AppResult<FriendshipUiModel> toFriendshipUiResult(
            AppResult<com.dangngulon.frontend.feature.zola.domain.model.Friendship> result
    ) {
        if (result instanceof AppResult.Success<com.dangngulon.frontend.feature.zola.domain.model.Friendship> success) {
            return AppResult.success(ZolaUiMapper.toUiModel(success.getData()));
        }

        if (result instanceof AppResult.Error<com.dangngulon.frontend.feature.zola.domain.model.Friendship> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected send friend request result"));
    }

    private AppResult<AddFriendSearchResultUiModel> toSearchUiResult(
            AppResult<AddFriendSearchProfile> result
    ) {
        if (result instanceof AppResult.Success<AddFriendSearchProfile> success) {
            AddFriendSearchProfile data = success.getData();
            if (data == null) {
                return AppResult.success(null);
            }

            return AppResult.success(new AddFriendSearchResultUiModel(
                    data.getUserId(),
                    data.getDisplayName(),
                    data.getPhoneNumber(),
                    data.getAvatarUrl(),
                    data.getStatus()
            ));
        }

        if (result instanceof AppResult.Error<AddFriendSearchProfile> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected search profile result"));
    }

    private AppResult<AddFriendProfileUiModel> toProfileUiResult(
            AppResult<AddFriendProfile> result
    ) {
        if (result instanceof AppResult.Success<AddFriendProfile> success) {
            AddFriendProfile data = success.getData();
            if (data == null) {
                return AppResult.success(null);
            }

            return AppResult.success(new AddFriendProfileUiModel(
                    data.getUserId(),
                    data.getDisplayName(),
                    data.getAvatarUrl(),
                    data.getPhoneNumber()
            ));
        }

        if (result instanceof AppResult.Error<AddFriendProfile> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected user profile result"));
    }
}
