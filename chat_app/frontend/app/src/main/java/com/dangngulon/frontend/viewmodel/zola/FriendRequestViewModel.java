package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.FriendRequestUseCase;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class FriendRequestViewModel extends ViewModel {

    private final FriendRequestUseCase friendRequestUseCase;

    private final MutableLiveData<Result<List<PendingFriendRequesterResponse>>> pendingRequesterResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<PendingFriendRequesterResponse>>> sendList = new MutableLiveData<>();
    private final MutableLiveData<Result<List<PendingFriendRequesterResponse>>> receivedList = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<FriendshipResponse>>> acceptFriendRequestResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<Void>>> rejectFriendRequestResult = new MutableLiveData<>();

    @Inject
    public FriendRequestViewModel(FriendRequestUseCase friendRequestUseCase) {
        this.friendRequestUseCase = friendRequestUseCase;
    }

    public LiveData<Result<List<PendingFriendRequesterResponse>>> getPendingRequesterResult() {
        return pendingRequesterResult;
    }

    public LiveData<Result<List<PendingFriendRequesterResponse>>> getSendList() {
        return sendList;
    }

    public LiveData<Result<List<PendingFriendRequesterResponse>>> getReceivedList() {
        return receivedList;
    }

    public LiveData<Event<Result<FriendshipResponse>>> getAcceptFriendRequestResult() {
        return acceptFriendRequestResult;
    }

    public LiveData<Event<Result<Void>>> getRejectFriendRequestResult() {
        return rejectFriendRequestResult;
    }

    public void loadData() {
        ViewModelHelper.callFuture(
                pendingRequesterResult,
                friendRequestUseCase.getPendingRequesters()
        );
    }

    public void acceptFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                acceptFriendRequestResult,
                friendRequestUseCase.acceptFriendRequest(userId)
        );
    }

    public void rejectFriendRequest(String userId) {
        ViewModelHelper.callFutureEvent(
                rejectFriendRequestResult,
                friendRequestUseCase.rejectFriendRequest(userId)
        );
    }

    public void handleResult(Result<List<PendingFriendRequesterResponse>> result) {
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
                List<PendingFriendRequesterResponse> source = result.getData();
                if (source == null) {
                    receivedList.setValue(Result.success(new ArrayList<>()));
                    sendList.setValue(Result.success(new ArrayList<>()));
                    return;
                }

                List<PendingFriendRequesterResponse> received = new ArrayList<>();
                List<PendingFriendRequesterResponse> sent = new ArrayList<>();

                for (PendingFriendRequesterResponse item : source) {
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
}
