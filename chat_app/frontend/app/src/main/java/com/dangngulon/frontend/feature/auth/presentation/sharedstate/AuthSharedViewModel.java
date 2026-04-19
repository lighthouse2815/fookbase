package com.dangngulon.frontend.feature.auth.presentation.sharedstate;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class AuthSharedViewModel extends ViewModel {

    private static final String KEY_REGISTER_USERNAME = "register_username";

    private final SavedStateHandle savedStateHandle;

    @Inject
    public AuthSharedViewModel(SavedStateHandle savedStateHandle) {
        this.savedStateHandle = savedStateHandle;
    }

    public void setRegisterUsername(String username) {
        savedStateHandle.set(KEY_REGISTER_USERNAME, username);
    }

    public LiveData<String> getRegisterUsername() {
        return savedStateHandle.getLiveData(KEY_REGISTER_USERNAME);
    }
}