package com.dangngulon.frontend.repository.zola_impl;

import com.dangngulon.frontend.api.zola.ConversationApi;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.ConversationCreateRequest;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.model.zola.response.RecentUserChatResponse;
import com.dangngulon.frontend.repository.zola.ConversationRepository;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class ConversationRepositoryImpl implements ConversationRepository {

    private final ConversationApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public ConversationRepositoryImpl(ConversationApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<ConversationResponse>> createConversation(ConversationCreateRequest request) {
        Call<ConversationResponse> call = api.createConversation(request);
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<List<ConversationResponse>>> getAllConversations() {
        Call<List<ConversationResponse>> call = api.getAllConversations();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<List<ConversationResponse>>> getAllGroups() {
        Call<List<ConversationResponse>> call = api.getAllGroups();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

    @Override
    public CompletableFuture<AppResult<List<RecentUserChatResponse>>> getRecentUserChat() {
        Call<List<RecentUserChatResponse>> call = api.getRecentUserChat();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }

}
