package com.dangngulon.frontend.domain.usecase.auth;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.domain.common.errors.RegisterError;
import com.dangngulon.frontend.model.auth.request.OTPRequest;
import com.dangngulon.frontend.model.auth.request.RegisterRequest;
import com.dangngulon.frontend.model.auth.request.VerifyOtpRequest;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.auth.response.RegisterResponse;
import com.dangngulon.frontend.repository.auth.AuthRepository;
import com.dangngulon.frontend.utils.enums.OTPType;
import com.dangngulon.frontend.utils.validators.PasswordPolicyValidator;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class RegisterUseCase {

    private final AuthRepository repository;

    @Inject
    public RegisterUseCase(AuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<RegisterResponse>> register(
            String username,
            String password,
            String confirmPassword,
            String email,
            String lastName,
            String firstName
    ) {
        if (lastName == null || lastName.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.LAST_NAME_EMPTY.name()))
            );
        }

        if (firstName == null || firstName.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.FIRST_NAME_EMPTY.name()))
            );
        }

        if (email == null || email.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.EMAIL_EMPTY.name()))
            );
        }

        if (username == null || username.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.USERNAME_EMPTY.name()))
            );
        }

        if (password == null || password.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.PASSWORD_EMPTY.name()))
            );
        }

        if (!PasswordPolicyValidator.validate(password)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(RegisterError.PASSWORD_INVALID.name()))
            );
        }

        if (confirmPassword == null || confirmPassword.isEmpty()) {
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
                new RegisterRequest(username, password, email, lastName, firstName)
        );
    }

    public CompletableFuture<AppResult<OtpVerifyResponse>> sendVerifyEmailOtpWhenNotLogin(String email) {
        if (email == null || email.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.EMAIL_EMPTY.name()
                            )
                    )
            );
        }
        return repository.sendVerifyEmailOtpWhenNotLogin(
                new OTPRequest(email, OTPType.EMAIL_VERIFY)
        );
    }

    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpEmailWhenNotLogin(String email, String otp) {
        if (email == null || email.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.EMAIL_EMPTY.name()
                            )
                    )
            );
        }

        if (otp == null || otp.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(
                            new AppError(
                                    RegisterError.OTP_EMPTY.name()
                            )
                    )
            );
        }
        return repository.verifyOtpEmailWhenNotLogin(new VerifyOtpRequest(email, otp));
    }
}

