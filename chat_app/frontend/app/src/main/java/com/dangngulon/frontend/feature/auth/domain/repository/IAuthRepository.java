package com.dangngulon.frontend.feature.auth.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;

import java.util.concurrent.CompletableFuture;

public interface IAuthRepository {

    void saveAuth(String token,
                         String refreshToken,
                         String userId,
                         String displayName);

    String getAccessToken();

    String getRefreshToken();

    String getUserId();

    String getDisplayName();

    void clearAuth();

    CompletableFuture<AppResult<RegisterAccountResult>> register(
            String username,
            String password,
            String email,
            String lastName,
            String firstName
    );

    CompletableFuture<AppResult<AuthSession>> login(String username, String password);

    CompletableFuture<AppResult<AuthSession>> refreshToken(String refreshToken);

    CompletableFuture<AppResult<Void>> logout();

    CompletableFuture<AppResult<OtpVerificationResult>> sendVerifyEmailOtpWhenNotLogin(String email);

    CompletableFuture<AppResult<OtpVerificationResult>> sendVerifyEmailOtpWhenLogin();

    CompletableFuture<AppResult<OtpVerificationResult>> sendResetPasswordOtpWhenNotLogin(String email);

    CompletableFuture<AppResult<OtpVerificationResult>> sendResetPasswordOtpWhenLogin();

    CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpEmailWhenNotLogin(String email, String otp);

    CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpEmailWhenLogin(String email, String otp);

    CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpResetPasswordWhenNotLogin(String email, String otp);

    CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpResetPasswordWhenLogin(String email, String otp);

    CompletableFuture<AppResult<GoogleAuthResult>> authWithGoogle(String token);

    CompletableFuture<AppResult<Void>> completeProfile(
            String firstName,
            String lastName,
            String phoneNumber,
            String birthday,
            String gender,
            String avatarUrl,
            String displayName
    );

    CompletableFuture<AppResult<Void>> resetPassword(String resetToken, String newPassword);
}
