package com.dangngulon.frontend.viewmodel.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.auth.UserProfileUseCase;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class UserProfileViewModel extends ViewModel {

    private final UserProfileUseCase userProfileUseCase;

    private final MutableLiveData<Result<UserProfileOverviewResponse>> myProfileResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<UserProfileResponse>>> userProfileResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<UserProfileSearchResponse>>> searchProfileResult = new MutableLiveData<>();

    @Inject
    public UserProfileViewModel(UserProfileUseCase userProfileUseCase) {
        this.userProfileUseCase = userProfileUseCase;
    }

    public LiveData<Result<UserProfileOverviewResponse>> getMyProfileResult() {
        return myProfileResult;
    }

    public LiveData<Event<Result<UserProfileResponse>>> getUserProfileResult() {
        return userProfileResult;
    }

    public LiveData<Event<Result<UserProfileSearchResponse>>> getSearchProfileResult() {
        return searchProfileResult;
    }

    public void getUserProfile(String userId) {
        ViewModelHelper.callFutureEvent(
                userProfileResult,
                userProfileUseCase.getOtherUserProfile(userId)
        );
    }

    public void getOverviewProfile() {
        ViewModelHelper.callFuture(
                myProfileResult,
                userProfileUseCase.getOverviewProfile()
        );
    }

    public void searchUserProfileByPhoneNumber(String phoneNumber) {
        ViewModelHelper.callFutureEvent(
                searchProfileResult,
                userProfileUseCase.searchUserProfileByPhoneNumber(phoneNumber)
        );
    }
}
