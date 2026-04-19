package com.dangngulon.frontend.feature.auth.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.RegisterError;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;
import com.dangngulon.frontend.core.utils.validators.PasswordPolicyValidator;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class RegisterUseCase {

    private final IAuthRepository repository;

    @Inject
    public RegisterUseCase(IAuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<RegisterAccountResult>> register(
            String username,
            String password,
            String confirmPassword,
            String email,
            String lastName,
            String firstName
    ) {
        String normalizedLastName = lastName == null ? null : lastName.trim();
        String normalizedFirstName = firstName == null ? null : firstName.trim();
        String normalizedEmail = email == null ? null : email.trim();
        String normalizedUsername = username == null ? null : username.trim();

        if (normalizedLastName == null || normalizedLastName.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.LAST_NAME_EMPTY.name()))
            );
        }

        if (normalizedFirstName == null || normalizedFirstName.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.FIRST_NAME_EMPTY.name()))
            );
        }

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.EMAIL_EMPTY.name()))
            );
        }

        if (normalizedUsername == null || normalizedUsername.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.USERNAME_EMPTY.name()))
            );
        }

        if (password == null || password.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.PASSWORD_EMPTY.name()))
            );
        }

        if (!PasswordPolicyValidator.validate(password)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.PASSWORD_INVALID.name()))
            );
        }

        if (confirmPassword == null || confirmPassword.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.CONFIRM_PASSWORD_EMPTY.name()))
            );
        }

        if (!password.equals(confirmPassword)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.PASSWORD_NOT_MATCH.name()))
            );
        }

        return repository.register(
                normalizedUsername,
                password,
                normalizedEmail,
                normalizedLastName,
                normalizedFirstName
        );
    }

    public CompletableFuture<AppResult<OtpVerificationResult>> sendVerifyEmailOtpWhenNotLogin(String email) {
        String normalizedEmail = email == null ? null : email.trim();

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.EMAIL_EMPTY.name()
                            )
                    )
            );
        }
        return repository.sendVerifyEmailOtpWhenNotLogin(normalizedEmail);
    }

    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpEmailWhenNotLogin(String email, String otp) {
        String normalizedEmail = email == null ? null : email.trim();
        String normalizedOtp = otp == null ? null : otp.trim();

        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.EMAIL_EMPTY.name()
                            )
                    )
            );
        }

        if (normalizedOtp == null || normalizedOtp.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.OTP_EMPTY.name()
                            )
                    )
            );
        }
        return repository.verifyOtpEmailWhenNotLogin(normalizedEmail, normalizedOtp);
    }
}
