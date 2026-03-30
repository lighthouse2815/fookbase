package com.dangngulon.frontend.domain.usecase.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.ConversationCreateRequest;
import com.dangngulon.frontend.model.zola.request.ConversationMemberRequest;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.model.zola.response.RecentUserChatResponse;
import com.dangngulon.frontend.repository.zola.ConversationRepository;
import com.dangngulon.frontend.utils.enums.ConversationType;
import com.dangngulon.frontend.utils.enums.MemberRole;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class CreateGroupUseCase {
    private final ConversationRepository conversationRepository;

    @Inject
    public CreateGroupUseCase(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    public CompletableFuture<AppResult<ConversationResponse>> createConversation(
            ConversationType type,
            String name,
            String createdBy,
            List<String> members
    ) {
        List<ConversationMemberRequest> memberRequests = new ArrayList<>();
        memberRequests.add(new ConversationMemberRequest(createdBy, MemberRole.ADMIN));
        for (String memberId : members) {
            memberRequests.add(new ConversationMemberRequest(memberId, MemberRole.MEMBER));
        }

        return conversationRepository.createConversation(
                new ConversationCreateRequest(
                        type,
                        name,
                        createdBy,
                        memberRequests
                )
        );
    }

    public CompletableFuture<AppResult<List<RecentUserChatResponse>>> getRecentUserChat() {
        return conversationRepository.getRecentUserChat();
    }
}
