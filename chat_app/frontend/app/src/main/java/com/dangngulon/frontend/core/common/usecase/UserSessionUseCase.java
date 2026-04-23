package com.dangngulon.frontend.core.common.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.session.domain.repository.ISessionRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class UserSessionUseCase {
    private final ISessionRepository sessionRepository;

    @Inject
    public UserSessionUseCase(ISessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public String getCurrentUserId() {
        return sessionRepository.getCurrentUserId();
    }

    public String getCurrentDisplayName() {
        return sessionRepository.getCurrentDisplayName();
    }

    public CompletableFuture<AppResult<Void>> logout() {
        return sessionRepository.logout();
    }
}
