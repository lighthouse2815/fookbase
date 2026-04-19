package com.dangngulon.frontend.feature.auth.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.usecase.ForgotPasswordUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ForgotPasswordViewModel extends ViewModel {

    private static final String KEY_RESET_TOKEN = "reset_password_token";

    private final SavedStateHandle savedStateHandle;
    private final ForgotPasswordUseCase forgotPasswordUseCase;

    private final MutableLiveData<Event<Result<OtpVerificationResult>>> sendResetPasswordOtpWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerificationResult>>> verifyOtpResetPasswordWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<Void>>> resetPasswordResult = new MutableLiveData<>();

    @Inject
    public ForgotPasswordViewModel(
            SavedStateHandle savedStateHandle,
            ForgotPasswordUseCase forgotPasswordUseCase
    ) {
        this.savedStateHandle = savedStateHandle;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
    }

    public LiveData<Event<Result<OtpVerificationResult>>> getSendResetPasswordOtpWhenNotLoginResult() {
        return sendResetPasswordOtpWhenNotLoginResult;
    }

    public LiveData<Event<Result<OtpVerificationResult>>> getVerifyOtpResetPasswordWhenNotLoginResult() {
        return verifyOtpResetPasswordWhenNotLoginResult;
    }

    public LiveData<Event<Result<Void>>> getResetPasswordResult() {
        return resetPasswordResult;
    }

    public void setResetPasswordToken(String token) {
        savedStateHandle.set(KEY_RESET_TOKEN, token);
    }

    public String getResetPasswordToken() {
        return savedStateHandle.get(KEY_RESET_TOKEN);
    }

    public void sendResetPasswordOtpWhenNotLogin(String email) {
        ViewModelHelper.callFutureEvent(
                sendResetPasswordOtpWhenNotLoginResult,
                forgotPasswordUseCase.sendResetPasswordOtpWhenNotLogin(email)
        );
    }

    public void verifyOtpResetPasswordWhenNotLogin(String email, String otp) {
        ViewModelHelper.callFutureEvent(
                verifyOtpResetPasswordWhenNotLoginResult,
                forgotPasswordUseCase.verifyOtpResetPasswordWhenNotLogin(email, otp)
        );
    }

    public void resetPassword(String resetToken,String newPassword, String confirmPassword) {
        ViewModelHelper.callFutureEvent(
                resetPasswordResult,
                forgotPasswordUseCase.resetPassword(resetToken,newPassword, confirmPassword)
        );
    }
}
