package com.dangngulon.frontend.feature.auth.data.remote.api;

import com.dangngulon.frontend.feature.auth.data.remote.dto.request.GoogleTokenRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.LoginRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.OTPRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.RefreshTokenRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.RegisterRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.ResetPasswordRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.VerifyOtpRequest;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.GoogleAuthResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.OtpVerifyResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.LoginResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.RegisterResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.TokenResponse;
import com.dangngulon.frontend.core.network.model.MessageResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface AuthApi {

    @POST("api/auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);

    @POST("api/auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("api/auth/refresh-token")
    Call<TokenResponse> refreshToken(@Body RefreshTokenRequest request);

    @POST("api/auth/logout")
    Call<Void> logout(@Body RefreshTokenRequest request);

    @POST("api/auth/otp/send/verify-email")
    Call<OtpVerifyResponse> sendVerifyEmailOtpWhenNotLogin(@Body OTPRequest request);

    @POST("api/auth/me/otp/send/verify-email")
    Call<OtpVerifyResponse> sendVerifyEmailOtpWhenLogin();

    @POST("api/auth/otp/send/reset-password")
    Call<OtpVerifyResponse> sendResetPasswordOtpWhenNotLogin(@Body OTPRequest request);

    @POST("api/auth/me/otp/send/reset-password")
    Call<OtpVerifyResponse> sendResetPasswordOtpWhenLogin();

    @POST("api/auth/otp/verify/email")
    Call<OtpVerifyResponse> verifyOtpEmailWhenNotLogin(@Body VerifyOtpRequest request);

    @POST("api/auth/me/otp/verify/email")
    Call<OtpVerifyResponse> verifyOtpEmailWhenLogin(@Body VerifyOtpRequest request);

    @POST("api/auth/otp/verify/password")
    Call<OtpVerifyResponse> verifyOtpResetPasswordWhenNotLogin(@Body VerifyOtpRequest request);

    @POST("api/auth/me/otp/verify/password")
    Call<OtpVerifyResponse> verifyOtpResetPasswordWhenLogin(@Body VerifyOtpRequest request);

    @POST("api/auth/google")
    Call<GoogleAuthResponse> authWithGoogle(@Body GoogleTokenRequest request);

    @POST("api/auth/reset-password")
    Call<MessageResponse> resetPassword(@Header("X-Reset-Token") String resetToken, @Body ResetPasswordRequest request);

}

