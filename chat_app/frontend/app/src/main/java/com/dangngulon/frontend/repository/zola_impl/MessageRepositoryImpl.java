package com.dangngulon.frontend.repository.zola_impl;

import com.dangngulon.frontend.api.zola.MessageApi;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.SendMessageRequest;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.repository.zola.MessageRepository;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class MessageRepositoryImpl implements MessageRepository {

    private final MessageApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public MessageRepositoryImpl(MessageApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<MessageResponse>> sendMessage(SendMessageRequest request) {
        Call<MessageResponse> call = api.sendMessage(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<MessageCursorPageResponse>> getMessages(
            String conversationId,
            Instant cursorCreatedAt,
            String cursorMessageId,
            int limit
    ) {
        Call<MessageCursorPageResponse> call = api.getMessages(
                conversationId,
                cursorCreatedAt,
                cursorMessageId,
                limit
        );
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }
}
