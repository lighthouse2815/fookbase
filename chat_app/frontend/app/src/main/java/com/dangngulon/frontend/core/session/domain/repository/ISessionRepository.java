package com.dangngulon.frontend.core.session.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;

import java.util.concurrent.CompletableFuture;

public interface ISessionRepository {

    String getCurrentUserId();

    String getCurrentDisplayName();

    CompletableFuture<AppResult<Void>> logout();
}
