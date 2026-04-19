package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.feature.zola.domain.usecase.FriendRequestUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendRequestUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendshipUiModel;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class FriendRequestViewModel extends ViewModel {

    private final FriendRequestUseCase friendRequestUseCase;

    private final MutableLiveData<Result<List<FriendRequestUiModel>>> pendingRequesterResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<FriendRequestUiModel>>> sendList = new MutableLiveData<>();
    private final MutableLiveData<Result<List<FriendRequestUiModel>>> receivedList = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<FriendshipUiModel>>> acceptFriendRequestResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<Void>>> rejectFriendRequestResult = new MutableLiveData<>();

    @Inject
    public FriendRequestViewModel(FriendRequestUseCase friendRequestUseCase) {
        this.friendRequestUseCase = friendRequestUseCase;
    }

    public LiveData<Result<List<FriendRequestUiModel>>> getPendingRequesterResult() {
        return pendingRequesterResult;
    }

    public LiveData<Result<List<FriendRequestUiModel>>> getSendList() {
        return sendList;
    }

    public LiveData<Result<List<FriendRequestUiModel>>> getReceivedList() {
        return receivedList;
    }

    public LiveData<Event<Result<FriendshipUiModel>>> getAcceptFriendRequestResult() {
        return acceptFriendRequestResult;
    }

    public LiveData<Event<Result<Void>>> getRejectFriendRequestResult() {
        return rejectFriendRequestResult;
    }

    public void loadData() {
        ViewModelHelper.callFuture(
                pendingRequesterResult,
                friendRequestUseCase.getPendingRequesters().thenApply(this::toFriendRequestUiResult)
        );
    }

    public void acceptFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                acceptFriendRequestResult,
                friendRequestUseCase.acceptFriendRequest(userId).thenApply(this::toFriendshipUiResult)
        );
    }

    public void rejectFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                rejectFriendRequestResult,
                friendRequestUseCase.rejectFriendRequest(userId)
        );
    }

    public void handleResult(Result<List<FriendRequestUiModel>> result) {
        if (result == null) return;

        switch (result.getStatus()) {
            case LOADING:
                receivedList.setValue(Result.loading());
                sendList.setValue(Result.loading());
                return;

            case ERROR:
                String errorMessage = result.getMessage() != null
                        ? result.getMessage()
                        : "Load friend requests failed";
                receivedList.setValue(Result.error(errorMessage));
                sendList.setValue(Result.error(errorMessage));
                return;

            case SUCCESS:
                List<FriendRequestUiModel> source = result.getData();
                if (source == null) {
                    receivedList.setValue(Result.success(new ArrayList<>()));
                    sendList.setValue(Result.success(new ArrayList<>()));
                    return;
                }

                List<FriendRequestUiModel> received = new ArrayList<>();
                List<FriendRequestUiModel> sent = new ArrayList<>();

                for (FriendRequestUiModel item : source) {
                    if (item.isRequester()) {
                        sent.add(item);
                    } else {
                        received.add(item);
                    }
                }

                receivedList.setValue(Result.success(received));
                sendList.setValue(Result.success(sent));
        }
    }

    private AppResult<List<FriendRequestUiModel>> toFriendRequestUiResult(
            AppResult<List<com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester>> result
    ) {
        if (result instanceof AppResult.Success<List<com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester>> success) {
            return AppResult.success(ZolaUiMapper.toFriendRequestUiList(success.getData()));
        }

        if (result instanceof AppResult.Error<List<com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester>> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected pending requesters result"));
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

        return AppResult.error(new AppError("Unexpected friendship result"));
    }
}
