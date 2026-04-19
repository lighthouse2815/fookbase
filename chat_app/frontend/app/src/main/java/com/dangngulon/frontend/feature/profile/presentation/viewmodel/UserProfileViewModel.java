package com.dangngulon.frontend.feature.profile.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileDetail;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileSearchResult;
import com.dangngulon.frontend.feature.profile.domain.usecase.UserProfileUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class UserProfileViewModel extends ViewModel {

    private final UserProfileUseCase userProfileUseCase;
    private final UserSessionUseCase userSessionUseCase;
    private final IAuthRepository authRepository;

    private final MutableLiveData<Result<UserProfileOverview>> myProfileResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<UserProfileDetail>>> userProfileResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<UserProfileSearchResult>>> searchProfileResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<Void>>> logoutResult = new MutableLiveData<>();

    @Inject
    public UserProfileViewModel(
            UserProfileUseCase userProfileUseCase,
            UserSessionUseCase userSessionUseCase,
            IAuthRepository authRepository
    ) {
        this.userProfileUseCase = userProfileUseCase;
        this.userSessionUseCase = userSessionUseCase;
        this.authRepository = authRepository;
    }

    public LiveData<Result<UserProfileOverview>> getMyProfileResult() {
        return myProfileResult;
    }

    public LiveData<Event<Result<UserProfileDetail>>> getUserProfileResult() {
        return userProfileResult;
    }

    public LiveData<Event<Result<UserProfileSearchResult>>> getSearchProfileResult() {
        return searchProfileResult;
    }

    public LiveData<Event<Result<Void>>> getLogoutResult() {
        return logoutResult;
    }

    public String getCurrentUserId() {
        return userSessionUseCase.getCurrentUserId();
    }

    public String getCurrentDisplayName() {
        return userSessionUseCase.getCurrentDisplayName();
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

    public void logout() {
        ViewModelHelper.callFutureEvent(
                logoutResult,
                authRepository.logout()
        );
    }
}
