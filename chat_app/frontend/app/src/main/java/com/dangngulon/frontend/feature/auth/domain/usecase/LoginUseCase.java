package com.dangngulon.frontend.feature.auth.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.LoginError;
import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class LoginUseCase {

    private final IAuthRepository repository;

    @Inject
    public LoginUseCase(IAuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<AuthSession>> login(String username, String password) {
        String normalizedUsername = username == null ? null : username.trim();

        if (normalizedUsername == null || normalizedUsername.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(LoginError.USERNAME_EMPTY.name()))
            );
        }

        if (password == null || password.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(LoginError.PASSWORD_EMPTY.name()))
            );
        }

        return repository.login(normalizedUsername, password)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<AuthSession> success) {
                        AuthSession data = success.getData();

                        if (data != null && hasText(data.getAccessToken())) {
                            repository.saveAuth(
                                    data.getAccessToken(),
                                    data.getRefreshToken(),
                                    data.getUserId(),
                                    data.getDisplayName()
                            );
                        }
                    }

                    return result;
                });
    }

    public CompletableFuture<AppResult<Boolean>> restoreSessionIfAvailable() {
        String accessToken = repository.getAccessToken();
        String refreshToken = repository.getRefreshToken();

        if (!hasText(accessToken) && !hasText(refreshToken)) {
            return CompletableFuture.completedFuture(AppResult.success(false));
        }

        if (!hasText(refreshToken)) {
            return CompletableFuture.completedFuture(AppResult.success(hasText(accessToken)));
        }

        return repository.refreshToken(refreshToken)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<AuthSession>) {
                        return AppResult.success(true);
                    }

                    if (result instanceof AppResult.Error<AuthSession> error) {
                        Integer code = error.getError().getCode();
                        if (code != null && code == 401) {
                            repository.clearAuth();
                            return AppResult.success(false);
                        }

                        return AppResult.success(hasText(accessToken));
                    }

                    return AppResult.success(false);
                });
    }

    public CompletableFuture<AppResult<GoogleAuthResult>> authWithGoogle(String token) {
        return repository.authWithGoogle(token)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<GoogleAuthResult> success) {
                        GoogleAuthResult data = success.getData();
                        if (data != null && hasText(data.getAccessToken())) {
                            repository.saveAuth(
                                    data.getAccessToken(),
                                    data.getRefreshToken(),
                                    data.getUserId(),
                                    data.getDisplayName()
                            );
                        }
                    }

                    return result;
                });
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
