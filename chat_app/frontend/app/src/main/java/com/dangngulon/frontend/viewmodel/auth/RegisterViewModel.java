package com.dangngulon.frontend.viewmodel.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.auth.RegisterUseCase;
import com.dangngulon.frontend.model.auth.request.OTPRequest;
import com.dangngulon.frontend.model.auth.request.RegisterRequest;
import com.dangngulon.frontend.model.auth.request.VerifyOtpRequest;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.auth.response.RegisterResponse;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class RegisterViewModel extends ViewModel {

    private final RegisterUseCase registerUseCase;

    private final MutableLiveData<Event<Result<RegisterResponse>>> registerResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerifyResponse>>> sendVerifyEmailOtpWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerifyResponse>>> verifyOtpEmailWhenNotLoginResult = new MutableLiveData<>();

    @Inject
    public RegisterViewModel(RegisterUseCase registerUseCase, ApiErrorMapper errorMapper) {
        this.registerUseCase = registerUseCase;
    }

    public LiveData<Event<Result<RegisterResponse>>> getRegisterResult() {
        return registerResult;
    }

    public LiveData<Event<Result<OtpVerifyResponse>>> getSendVerifyEmailOtpWhenNotLoginResult() {
        return sendVerifyEmailOtpWhenNotLoginResult;
    }

    public LiveData<Event<Result<OtpVerifyResponse>>> getVerifyOtpEmailWhenNotLoginResult() {
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
