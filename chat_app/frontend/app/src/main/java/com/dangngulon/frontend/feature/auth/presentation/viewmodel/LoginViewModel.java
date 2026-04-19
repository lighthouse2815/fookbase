package com.dangngulon.frontend.feature.auth.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.usecase.LoginUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class LoginViewModel extends ViewModel {

    private final LoginUseCase loginUseCase;

    private final MutableLiveData<Event<Result<AuthSession>>> loginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<GoogleAuthResult>>> googleAuthResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<Boolean>>> restoreSessionResult = new MutableLiveData<>();

    @Inject
    public LoginViewModel(LoginUseCase loginUseCase) {
        this.loginUseCase = loginUseCase;
    }

    public LiveData<Event<Result<AuthSession>>> getLoginResult() {
        return loginResult;
    }

    public LiveData<Event<Result<GoogleAuthResult>>> getGoogleAuthResult() {
        return googleAuthResult;
    }

    public LiveData<Event<Result<Boolean>>> getRestoreSessionResult() {
        return restoreSessionResult;
    }

    public void login(String username, String password) {
        ViewModelHelper.callFutureEvent(
                loginResult,
                loginUseCase.login(username, password)
        );
    }

    public void authWithGoogle(String token) {
        ViewModelHelper.callFutureEvent(
                googleAuthResult,
                loginUseCase.authWithGoogle(token)
        );
    }

    public void restoreSessionIfAvailable() {
        ViewModelHelper.callFutureEvent(
                restoreSessionResult,
                loginUseCase.restoreSessionIfAvailable()
        );
    }
}
