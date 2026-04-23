package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;

import java.util.concurrent.CompletableFuture;

public interface IUploadRepository {
    CompletableFuture<AppResult<String>> upload(String fileName, String contentType, byte[] bytes);
}
