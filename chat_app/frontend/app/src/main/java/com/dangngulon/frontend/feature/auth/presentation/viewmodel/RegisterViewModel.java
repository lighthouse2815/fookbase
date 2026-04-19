package com.dangngulon.frontend.feature.auth.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;
import com.dangngulon.frontend.feature.auth.domain.usecase.RegisterUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class RegisterViewModel extends ViewModel {

    private final RegisterUseCase registerUseCase;

    private final MutableLiveData<Event<Result<RegisterAccountResult>>> registerResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerificationResult>>> sendVerifyEmailOtpWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerificationResult>>> verifyOtpEmailWhenNotLoginResult = new MutableLiveData<>();

    @Inject
    public RegisterViewModel(RegisterUseCase registerUseCase) {
        this.registerUseCase = registerUseCase;
    }

    public LiveData<Event<Result<RegisterAccountResult>>> getRegisterResult() {
        return registerResult;
    }

    public LiveData<Event<Result<OtpVerificationResult>>> getSendVerifyEmailOtpWhenNotLoginResult() {
        return sendVerifyEmailOtpWhenNotLoginResult;
    }

    public LiveData<Event<Result<OtpVerificationResult>>> getVerifyOtpEmailWhenNotLoginResult() {
        return verifyOtpEmailWhenNotLoginResult;
    }

    public void register(
            String username,
            String password,
            String confirmPassword,
            String email,
            String lastName,
            String firstName
    ) {
        ViewModelHelper.callFutureEvent(
                registerResult,
                registerUseCase.register(username, password, confirmPassword, email, lastName, firstName)
        );
    }

    public void sendVerifyEmailOtpWhenNotLogin(String email) {
        ViewModelHelper.callFutureEvent(
                sendVerifyEmailOtpWhenNotLoginResult,
                registerUseCase.sendVerifyEmailOtpWhenNotLogin(email)
        );
    }

    public void verifyOtpEmailWhenNotLogin(String email, String otp) {
        ViewModelHelper.callFutureEvent(
                verifyOtpEmailWhenNotLoginResult,
                registerUseCase.verifyOtpEmailWhenNotLogin(email, otp)
        );
    }
}
