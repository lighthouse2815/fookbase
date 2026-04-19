package com.dangngulon.frontend.feature.auth.data.repository;

import com.dangngulon.frontend.feature.auth.data.remote.api.AuthApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;
import com.dangngulon.frontend.feature.auth.data.remote.dto.request.CompleteProfileRequest;
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
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;
import com.dangngulon.frontend.feature.auth.data.mapper.AuthResponseMapper;
import com.dangngulon.frontend.core.network.model.MessageResponse;
import com.dangngulon.frontend.core.utils.data.AuthManager;
import com.dangngulon.frontend.core.utils.enums.OTPType;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class AuthRepository implements IAuthRepository {

    private final AuthApi api;
    private final ApiErrorMapper errorMapper;
    private final AuthManager authManager;

    @Inject
    public AuthRepository(AuthApi api, ApiErrorMapper errorMapper, AuthManager authManager) {
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
    public String getAccessToken() {
        return authManager.getAccessToken();
    }

    @Override
    public String getRefreshToken() {
        return authManager.getRefreshToken();
    }

    @Override
    public String getUserId() {
        return authManager.getUserId();
    }

    @Override
    public String getDisplayName() {
        return authManager.getDisplayName();
    }

    @Override
    public void clearAuth() {
        authManager.clear();
    }

    @Override
    public CompletableFuture<AppResult<RegisterAccountResult>> register(
            String username,
            String password,
            String email,
            String lastName,
            String firstName
    ) {
        RegisterRequest request = new RegisterRequest(username, password, email, lastName, firstName);
        Call<RegisterResponse> call = api.register(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<RegisterResponse> success) {
                        return AppResult.success(
                                AuthResponseMapper.toRegisterAccountResult(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<RegisterResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected register result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<AuthSession>> login(String username, String password) {
        Call<LoginResponse> call = api.login(new LoginRequest(username, password));
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<LoginResponse> success) {
                        return AppResult.success(
                                AuthResponseMapper.toAuthSession(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<LoginResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected login result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<AuthSession>> refreshToken(String refreshToken) {
        if (!hasText(refreshToken)) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError("Missing refresh token"))
            );
        }

        Call<TokenResponse> call = api.refreshToken(new RefreshTokenRequest(refreshToken));
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<TokenResponse> success) {
                        TokenResponse tokenResponse = success.getData();
                        String refreshedAccessToken = tokenResponse != null
                                ? tokenResponse.getAccessToken()
                                : null;
                        String refreshedRefreshToken = tokenResponse != null
                                ? tokenResponse.getRefreshToken()
                                : null;

                        if (!hasText(refreshedAccessToken)) {
                            return AppResult.error(new AppError("Invalid refresh token response"));
                        }

                        String resolvedRefreshToken = hasText(refreshedRefreshToken)
                                ? refreshedRefreshToken
                                : refreshToken;

                        String userId = authManager.getUserId();
                        String displayName = authManager.getDisplayName();

                        authManager.saveAuth(
                                refreshedAccessToken,
                                resolvedRefreshToken,
                                userId,
                                displayName
                        );

                        return AppResult.success(
                                new AuthSession(
                                        refreshedAccessToken,
                                        resolvedRefreshToken,
                                        userId,
                                        displayName,
                                        true,
                                        null,
                                        null
                                )
                        );
                    }

                    if (result instanceof AppResult.Error<TokenResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected refresh token result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<Void>> logout() {
        String refreshToken = authManager.getRefreshToken();
        if (!hasText(refreshToken)) {
            authManager.clear();
            return CompletableFuture.completedFuture(AppResult.success(null));
        }

        Call<Void> call = api.logout(new RefreshTokenRequest(refreshToken));
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    authManager.clear();
                    return AppResult.success(null);
                });
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> sendVerifyEmailOtpWhenNotLogin(String email) {
        OTPRequest request = new OTPRequest(email, OTPType.EMAIL_VERIFY);
        Call<OtpVerifyResponse> call = api.sendVerifyEmailOtpWhenNotLogin(request);
        return mapOtpResult(call, "Unexpected send verify email otp result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> sendVerifyEmailOtpWhenLogin() {
        Call<OtpVerifyResponse> call = api.sendVerifyEmailOtpWhenLogin();
        return mapOtpResult(call, "Unexpected send verify email otp (login) result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> sendResetPasswordOtpWhenNotLogin(String email) {
        OTPRequest request = new OTPRequest(email, OTPType.PASSWORD_RESET);
        Call<OtpVerifyResponse> call = api.sendResetPasswordOtpWhenNotLogin(request);
        return mapOtpResult(call, "Unexpected send reset password otp result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> sendResetPasswordOtpWhenLogin() {
        Call<OtpVerifyResponse> call = api.sendResetPasswordOtpWhenLogin();
        return mapOtpResult(call, "Unexpected send reset password otp (login) result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpEmailWhenNotLogin(String email, String otp) {
        VerifyOtpRequest request = new VerifyOtpRequest(email, otp);
        Call<OtpVerifyResponse> call = api.verifyOtpEmailWhenNotLogin(request);
        return mapOtpResult(call, "Unexpected verify email otp result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpEmailWhenLogin(String email, String otp) {
        VerifyOtpRequest request = new VerifyOtpRequest(email, otp);
        Call<OtpVerifyResponse> call = api.verifyOtpEmailWhenLogin(request);
        return mapOtpResult(call, "Unexpected verify email otp (login) result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpResetPasswordWhenNotLogin(String email, String otp) {
        VerifyOtpRequest request = new VerifyOtpRequest(email, otp);
        Call<OtpVerifyResponse> call = api.verifyOtpResetPasswordWhenNotLogin(request);
        return mapOtpResult(call, "Unexpected verify reset password otp result");
    }

    @Override
    public CompletableFuture<AppResult<OtpVerificationResult>> verifyOtpResetPasswordWhenLogin(String email, String otp) {
        VerifyOtpRequest request = new VerifyOtpRequest(email, otp);
        Call<OtpVerifyResponse> call = api.verifyOtpResetPasswordWhenLogin(request);
        return mapOtpResult(call, "Unexpected verify reset password otp (login) result");
    }

    @Override
    public CompletableFuture<AppResult<GoogleAuthResult>> authWithGoogle(String token) {
        Call<GoogleAuthResponse> call = api.authWithGoogle(new GoogleTokenRequest(token));
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<GoogleAuthResponse> success) {
                        return AppResult.success(
                                AuthResponseMapper.toGoogleAuthResult(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<GoogleAuthResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected google auth result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<Void>> completeProfile(
            String firstName,
            String lastName,
            String phoneNumber,
            String birthday,
            String gender,
            String avatarUrl,
            String displayName
    ) {
        Call<Void> call = api.completeProfile(new CompleteProfileRequest(
                firstName,
                lastName,
                phoneNumber,
                birthday,
                gender,
                avatarUrl,
                displayName
        ));

        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<Void>) {
                        return AppResult.success(null);
                    }

                    if (result instanceof AppResult.Error<Void> error) {
                        Integer code = error.getError().getCode();
                        if (code != null && code >= 200 && code < 300) {
                            return AppResult.success(null);
                        }

                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected complete profile result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<Void>> resetPassword(String resetToken, String newPassword) {
        ResetPasswordRequest request = new ResetPasswordRequest(newPassword);
        Call<MessageResponse> call = api.resetPassword(resetToken, request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<MessageResponse>) {
                        return AppResult.success(null);
                    }

                    if (result instanceof AppResult.Error<MessageResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected reset password result"));
                });
    }

    private CompletableFuture<AppResult<OtpVerificationResult>> mapOtpResult(
            Call<OtpVerifyResponse> call,
            String unexpectedMessage
    ) {
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<OtpVerifyResponse> success) {
                        return AppResult.success(
                                AuthResponseMapper.toOtpVerificationResult(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<OtpVerifyResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError(unexpectedMessage));
                });
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}


