package com.dangngulon.frontend.domain.usecase.auth;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.domain.common.errors.LoginError;
import com.dangngulon.frontend.model.auth.request.GoogleTokenRequest;
import com.dangngulon.frontend.model.auth.request.LoginRequest;
import com.dangngulon.frontend.model.auth.response.GoogleAuthResponse;
import com.dangngulon.frontend.model.auth.response.LoginResponse;
import com.dangngulon.frontend.repository.auth.AuthRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class LoginUseCase {

    private final AuthRepository repository;

    @Inject
    public LoginUseCase(AuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<LoginResponse>> login(String username, String password) {
        if (username == null || username.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(LoginError.USERNAME_EMPTY.name()))
            );
        }

        if (password == null || password.isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(LoginError.PASSWORD_EMPTY.name()))
            );
        }

        return repository.login(new LoginRequest(username, password))
                .thenApply(result -> {
                    if (result instanceof AppResult.Success) {
                        LoginResponse data = ((AppResult.Success<LoginResponse>) result).getData();

                        if (data != null) {
                            repository.saveAuth(
                                    data.getToken(),
                                    null,
                                    data.getUserId(),
                                    data.getDisplayName()
                            );
                        }
                    }

                    return result;
                });
    }

    public CompletableFuture<AppResult<GoogleAuthResponse>> authWithGoogle(String token) {
        return repository.authWithGoogle(new GoogleTokenRequest(token));
    }
}
