package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationCreateCommand;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface IConversationRepository {

    CompletableFuture<AppResult<Conversation>> createConversation(ConversationCreateCommand command);

    CompletableFuture<AppResult<List<Conversation>>> getAllConversations();

    CompletableFuture<AppResult<List<Conversation>>> getAllGroups();

    CompletableFuture<AppResult<List<RecentUserChat>>> getRecentUserChat();

}
