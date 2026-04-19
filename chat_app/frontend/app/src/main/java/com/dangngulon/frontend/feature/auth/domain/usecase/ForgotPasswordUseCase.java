package com.dangngulon.frontend.feature.auth.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.ForgotPasswordError;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;
import com.dangngulon.frontend.core.utils.validators.PasswordPolicyValidator;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class ForgotPasswordUseCase {

    private final IAuthRepository repository;

    @Inject
    public ForgotPasswordUseCase(IAuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<OtpVerificationResult>> sendResetPasswordOtpWhenNotLogin(String email) {
        String normalizedEmail = email == null ? null : email.trim();

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.EMAIL_EMPTY.name()))
            );
        }

        return repository.sendResetPasswordOtpWhenNotLogin(normalizedEmail);
    }

    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpResetPasswordWhenNotLogin(String email, String otp) {
        String normalizedEmail = email == null ? null : email.trim();
        String normalizedOtp = otp == null ? null : otp.trim();

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.EMAIL_EMPTY.name()))
            );
        }

        if (normalizedOtp == null || normalizedOtp.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.OTP_EMPTY.name()))
            );
        }

        return repository.verifyOtpResetPasswordWhenNotLogin(normalizedEmail, normalizedOtp);
    }

    public CompletableFuture<AppResult<Void>> resetPassword(
            String resetToken,
            String newPassword,
            String confirmPassword
    ) {
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_EMPTY.name()))
            );
        }

        if (!PasswordPolicyValidator.validate(newPassword)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_INVALID.name()))
            );
        }

        if (confirmPassword == null || confirmPassword.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.CONFIRM_PASSWORD_EMPTY.name()))
            );
        }

        if (!newPassword.equals(confirmPassword)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.PASSWORD_NOT_MATCH.name()))
            );
        }

        String normalizedResetToken = resetToken == null ? null : resetToken.trim();
        if (normalizedResetToken == null || normalizedResetToken.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(ForgotPasswordError.TOKEN_INVALID.name()))
            );
        }

        return repository.resetPassword(normalizedResetToken, newPassword);
    }

}
