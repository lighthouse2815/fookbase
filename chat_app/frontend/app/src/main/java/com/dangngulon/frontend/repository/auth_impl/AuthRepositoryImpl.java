package com.dangngulon.frontend.repository.auth_impl;

import com.dangngulon.frontend.api.auth.AuthApi;
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
import com.dangngulon.frontend.repository.auth.AuthRepository;
import com.dangngulon.frontend.utils.data.AuthManager;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class AuthRepositoryImpl implements AuthRepository {

    private final AuthApi api;
    private final ApiErrorMapper errorMapper;
    private final AuthManager authManager;

    @Inject
    public AuthRepositoryImpl(AuthApi api, ApiErrorMapper errorMapper, AuthManager authManager) {
        this.api = api;
        this.errorMapper = errorMapper;
        this.authManager = authManager;
    }


    @Override
    public void saveAuth(String token,
                         String refreshToken,
                         String userId,
                         String displayName) {

        authManager.saveAuth(token, refreshToken, userId, displayName);
    }

    @Override
    public CompletableFuture<AppResult<RegisterResponse>> register(RegisterRequest request) {
        Call<RegisterResponse> call = api.register(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<LoginResponse>> login(LoginRequest request) {
        Call<LoginResponse> call = api.login(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> sendVerifyEmailOtpWhenNotLogin(OTPRequest request) {
        Call<OtpVerifyResponse> call = api.sendVerifyEmailOtpWhenNotLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> sendVerifyEmailOtpWhenLogin() {
        Call<OtpVerifyResponse> call = api.sendVerifyEmailOtpWhenLogin();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> sendResetPasswordOtpWhenNotLogin(OTPRequest request) {
        Call<OtpVerifyResponse> call = api.sendResetPasswordOtpWhenNotLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> sendResetPasswordOtpWhenLogin() {
        Call<OtpVerifyResponse> call = api.sendResetPasswordOtpWhenLogin();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpEmailWhenNotLogin(VerifyOtpRequest request) {
        Call<OtpVerifyResponse> call = api.verifyOtpEmailWhenNotLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpEmailWhenLogin(VerifyOtpRequest request) {
        Call<OtpVerifyResponse> call = api.verifyOtpEmailWhenLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpResetPasswordWhenNotLogin(VerifyOtpRequest request) {
        Call<OtpVerifyResponse> call = api.verifyOtpResetPasswordWhenNotLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<OtpVerifyResponse>> verifyOtpResetPasswordWhenLogin(VerifyOtpRequest request) {
        Call<OtpVerifyResponse> call = api.verifyOtpResetPasswordWhenLogin(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<GoogleAuthResponse>> authWithGoogle(GoogleTokenRequest request) {
        Call<GoogleAuthResponse> call = api.authWithGoogle(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<MessageResponse>> resetPassword(String resetToken, ResetPasswordRequest request) {
        Call<MessageResponse> call = api.resetPassword(resetToken, request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }
}


