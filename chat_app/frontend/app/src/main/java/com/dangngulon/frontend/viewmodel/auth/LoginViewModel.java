package com.dangngulon.frontend.viewmodel.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.auth.LoginUseCase;
import com.dangngulon.frontend.model.auth.request.LoginRequest;
import com.dangngulon.frontend.model.auth.response.GoogleAuthResponse;
import com.dangngulon.frontend.model.auth.response.LoginResponse;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class LoginViewModel extends ViewModel {

    private final LoginUseCase loginUseCase;

    private final MutableLiveData<Event<Result<LoginResponse>>> loginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<GoogleAuthResponse>>> googleAuthResult = new MutableLiveData<>();

    @Inject
    public LoginViewModel(LoginUseCase loginUseCase) {
        this.loginUseCase = loginUseCase;
    }

    public LiveData<Event<Result<LoginResponse>>> getLoginResult() {
        return loginResult;
    }

    public LiveData<Event<Result<GoogleAuthResponse>>> getGoogleAuthResult() {
        return googleAuthResult;
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
}
