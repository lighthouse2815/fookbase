package com.dangngulon.frontend.core.common.usecase;

import com.dangngulon.frontend.core.utils.data.AuthManager;

import javax.inject.Inject;

public class UserSessionUseCase {
    private final AuthManager authManager;

    @Inject
    public UserSessionUseCase(AuthManager authManager) {
        this.authManager = authManager;
    }

    public String getCurrentUserId() {
        return authManager.getUserId();
    }

    public String getCurrentDisplayName() {
        return authManager.getDisplayName();
    }
}
