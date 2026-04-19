package com.dangngulon.frontend.feature.auth.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class CompleteProfileUseCase {

    private final IAuthRepository repository;

    @Inject
    public CompleteProfileUseCase(IAuthRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<Void>> completeProfile(
            String firstName,
            String lastName,
            String phoneNumber,
            String birthday,
            String gender,
            String avatarUrl,
            String displayName
    ) {
        return repository.completeProfile(
                firstName,
                lastName,
                phoneNumber,
                birthday,
                gender,
                avatarUrl,
                displayName
        );
    }
}
