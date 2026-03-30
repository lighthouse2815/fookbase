package com.dangngulon.frontend.repository.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.ConversationCreateRequest;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.model.zola.response.RecentUserChatResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface ConversationRepository {

    CompletableFuture<AppResult<ConversationResponse>> createConversation(ConversationCreateRequest request);

    CompletableFuture<AppResult<List<ConversationResponse>>> getAllConversations();

    CompletableFuture<AppResult<List<ConversationResponse>>> getAllGroups();

    CompletableFuture<AppResult<List<RecentUserChatResponse>>> getRecentUserChat();

}
