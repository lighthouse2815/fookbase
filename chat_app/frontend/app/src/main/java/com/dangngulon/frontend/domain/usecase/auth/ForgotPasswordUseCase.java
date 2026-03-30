package com.dangngulon.frontend.domain.usecase.auth;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.domain.common.errors.ForgotPasswordError;
import com.dangngulon.frontend.model.auth.request.OTPRequest;
import com.dangngulon.frontend.model.auth.request.ResetPasswordRequest;
import com.dangngulon.frontend.model.auth.request.VerifyOtpRequest;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.error.MessageResponse;
import com.dangngulon.frontend.repository.auth.AuthRepository;
import com.dangngulon.frontend.utils.enums.OTPType;
import com.dangngulon.frontend.utils.validators.PasswordPolicyValidator;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class ForgotPasswordUseCase {

    private final AuthRepository repository;

    @Inject
    public ForgotPasswordUseCase(AuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<OtpVerifyResponse>> sendResetPasswordOtpWhenNotLogin(String email) {
        if (email == null || email.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.EMAIL_EMPTY.name()))
            );
        }

        return repository.sendResetPasswordOtpWhenNotLogin(
                new OTPRequest(email, OTPType.PASSWORD_RESET)
        );
    }

    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpResetPasswordWhenNotLogin(String email, String otp) {
        if (email == null || email.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.EMAIL_EMPTY.name()))
            );
        }

        if (otp == null || otp.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.OTP_EMPTY.name()))
            );
        }

        return repository.verifyOtpResetPasswordWhenNotLogin(
                new VerifyOtpRequest(email, otp)
        );
    }

    public CompletableFuture<AppResult<MessageResponse>> resetPassword(
            String resetToken,
            String newPassword,
            String confirmPassword
    ) {
        if (newPassword == null || newPassword.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_EMPTY.name()))
            );
        }

        if (!PasswordPolicyValidator.validate(newPassword)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_INVALID.name()))
            );
        }

        if (confirmPassword == null || confirmPassword.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.CONFIRM_PASSWORD_EMPTY.name()))
            );
        }

        if (!newPassword.equals(confirmPassword)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_NOT_MATCH.name()))
            );
        }

        if (resetToken == null || resetToken.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.TOKEN_INVALID.name()))
            );
        }

        return repository.resetPassword(
                resetToken,
                new ResetPasswordRequest(newPassword)
        );
    }

}
