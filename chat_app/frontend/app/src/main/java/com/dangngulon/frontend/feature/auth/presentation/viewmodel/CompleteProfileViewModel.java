package com.dangngulon.frontend.feature.auth.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.feature.auth.domain.usecase.CompleteProfileUseCase;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class CompleteProfileViewModel extends ViewModel {

    private final CompleteProfileUseCase completeProfileUseCase;
    private final MutableLiveData<Event<Result<Void>>> completeProfileResult = new MutableLiveData<>();

    @Inject
    public CompleteProfileViewModel(CompleteProfileUseCase completeProfileUseCase) {
        this.completeProfileUseCase = completeProfileUseCase;
    }

    public LiveData<Event<Result<Void>>> getCompleteProfileResult() {
        return completeProfileResult;
    }

    public void completeProfile(
            String firstName,
            String lastName,
            String phoneNumber,
            String birthday,
            String gender,
            String avatarUrl,
            String displayName
    ) {
        ViewModelHelper.callFutureEvent(
                completeProfileResult,
                completeProfileUseCase.completeProfile(
                        firstName,
                        lastName,
                        phoneNumber,
                        birthday,
                        gender,
                        avatarUrl,
                        displayName
                )
        );
    }
}
