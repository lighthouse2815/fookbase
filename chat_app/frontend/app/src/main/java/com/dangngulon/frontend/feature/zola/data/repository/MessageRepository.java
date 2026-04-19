package com.dangngulon.frontend.feature.zola.data.repository;

import com.dangngulon.frontend.feature.zola.data.remote.api.MessageApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.data.mapper.MessageDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.SendMessageRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageCursorPageResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class MessageRepository implements IMessageRepository {

    private final MessageApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public MessageRepository(MessageApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<Message>> sendMessage(SendMessageCommand command) {
        SendMessageRequest request = MessageDataMapper.toRequest(command);
        Call<MessageResponse> call = api.sendMessage(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<MessageResponse> success) {
                        return AppResult.success(MessageDataMapper.toDomain(success.getData()));
                    }

                    if (result instanceof AppResult.Error<MessageResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected send message result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<MessageCursorPage>> getMessages(
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
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<MessageCursorPageResponse> success) {
                        return AppResult.success(MessageDataMapper.toDomain(success.getData()));
                    }

                    if (result instanceof AppResult.Error<MessageCursorPageResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected get messages result"));
                });
    }
}
