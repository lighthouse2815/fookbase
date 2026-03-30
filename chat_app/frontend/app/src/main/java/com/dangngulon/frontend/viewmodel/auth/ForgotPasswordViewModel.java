package com.dangngulon.frontend.viewmodel.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.auth.ForgotPasswordUseCase;
import com.dangngulon.frontend.model.auth.request.OTPRequest;
import com.dangngulon.frontend.model.auth.request.ResetPasswordRequest;
import com.dangngulon.frontend.model.auth.request.VerifyOtpRequest;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.error.MessageResponse;
import com.dangngulon.frontend.utils.enums.OTPType;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;
import com.dangngulon.frontend.utils.others.Event;
import com.dangngulon.frontend.utils.others.Result;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ForgotPasswordViewModel extends ViewModel {

    private static final String KEY_RESET_TOKEN = "reset_password_token";

    private final SavedStateHandle savedStateHandle;
    private final ForgotPasswordUseCase forgotPasswordUseCase;

    private final MutableLiveData<Event<Result<OtpVerifyResponse>>> sendResetPasswordOtpWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<OtpVerifyResponse>>> verifyOtpResetPasswordWhenNotLoginResult = new MutableLiveData<>();
    private final MutableLiveData<Event<Result<MessageResponse>>> resetPasswordResult = new MutableLiveData<>();

    @Inject
    public ForgotPasswordViewModel(
            SavedStateHandle savedStateHandle,
            ForgotPasswordUseCase forgotPasswordUseCase
    ) {
        this.savedStateHandle = savedStateHandle;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
    }

    public LiveData<Event<Result<OtpVerifyResponse>>> getSendResetPasswordOtpWhenNotLoginResult() {
        return sendResetPasswordOtpWhenNotLoginResult;
    }

    public LiveData<Event<Result<OtpVerifyResponse>>> getVerifyOtpResetPasswordWhenNotLoginResult() {
        return verifyOtpResetPasswordWhenNotLoginResult;
    }

    public LiveData<Event<Result<MessageResponse>>> getResetPasswordResult() {
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
