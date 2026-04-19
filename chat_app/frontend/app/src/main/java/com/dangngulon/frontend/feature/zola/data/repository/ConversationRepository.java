package com.dangngulon.frontend.feature.zola.data.repository;

import com.dangngulon.frontend.feature.zola.data.remote.api.ConversationApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.data.mapper.ConversationDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.ConversationCreateRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.ConversationResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.RecentUserChatResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationCreateCommand;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class ConversationRepository implements IConversationRepository {

    private final ConversationApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public ConversationRepository(ConversationApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<Conversation>> createConversation(ConversationCreateCommand command) {
        ConversationCreateRequest request = ConversationDataMapper.toRequest(command);
        Call<ConversationResponse> call = api.createConversation(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<ConversationResponse> success) {
                        return AppResult.success(ConversationDataMapper.toDomain(success.getData()));
                    }

                    if (result instanceof AppResult.Error<ConversationResponse> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected create conversation result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<List<Conversation>>> getAllConversations() {
        Call<List<ConversationResponse>> call = api.getAllConversations();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<List<ConversationResponse>> success) {
                        return AppResult.success(ConversationDataMapper.toDomainList(success.getData()));
                    }

                    if (result instanceof AppResult.Error<List<ConversationResponse>> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected conversations result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<List<Conversation>>> getAllGroups() {
        Call<List<ConversationResponse>> call = api.getAllGroups();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<List<ConversationResponse>> success) {
                        return AppResult.success(ConversationDataMapper.toDomainList(success.getData()));
                    }

                    if (result instanceof AppResult.Error<List<ConversationResponse>> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected groups result"));
                });
    }

    @Override
    public CompletableFuture<AppResult<List<RecentUserChat>>> getRecentUserChat() {
        Call<List<RecentUserChatResponse>> call = api.getRecentUserChat();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<List<RecentUserChatResponse>> success) {
                        return AppResult.success(
                                ConversationDataMapper.toRecentUserChatDomainList(success.getData())
                        );
                    }

                    if (result instanceof AppResult.Error<List<RecentUserChatResponse>> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected recent user chat result"));
                });
    }

}
