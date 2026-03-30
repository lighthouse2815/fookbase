package com.dangngulon.frontend.repository.auth;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.auth.request.GoogleTokenRequest;
import com.dangngulon.frontend.model.auth.request.LoginRequest;
import com.dangngulon.frontend.model.auth.request.OTPRequest;
import com.dangngulon.frontend.model.auth.request.RegisterRequest;
import com.dangngulon.frontend.model.auth.request.ResetPasswordRequest;
import com.dangngulon.frontend.model.auth.request.VerifyOtpRequest;
import com.dangngulon.frontend.model.auth.response.GoogleAuthResponse;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.error.MessageResponse;
import com.dangngulon.frontend.model.auth.response.LoginResponse;
import com.dangngulon.frontend.model.auth.response.RegisterResponse;

import java.util.concurrent.CompletableFuture;

public interface AuthRepository {

    void saveAuth(String token,
                         String refreshToken,
                         String userId,
                         String displayName);

    CompletableFuture<AppResult<RegisterResponse>> register(RegisterRequest request);

    CompletableFuture<AppResult<LoginResponse>> login(LoginRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> sendVerifyEmailOtpWhenNotLogin(OTPRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> sendVerifyEmailOtpWhenLogin();

    CompletableFuture<AppResult<OtpVerifyResponse>> sendResetPasswordOtpWhenNotLogin(OTPRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> sendResetPasswordOtpWhenLogin();

    CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpEmailWhenNotLogin(VerifyOtpRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpEmailWhenLogin(VerifyOtpRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpResetPasswordWhenNotLogin(VerifyOtpRequest request);

    CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpResetPasswordWhenLogin(VerifyOtpRequest request);

    CompletableFuture<AppResult<GoogleAuthResponse>> authWithGoogle(GoogleTokenRequest request);

    CompletableFuture<AppResult<MessageResponse>> resetPassword(String resetToken, ResetPasswordRequest request);
}