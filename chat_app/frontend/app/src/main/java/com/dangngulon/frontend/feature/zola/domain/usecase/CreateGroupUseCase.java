package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationCreateCommand;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationMemberCommand;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;
import com.dangngulon.frontend.core.utils.enums.ConversationType;
import com.dangngulon.frontend.core.utils.enums.MemberRole;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class CreateGroupUseCase {
    private final IConversationRepository conversationRepository;

    @Inject
    public CreateGroupUseCase(IConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    public CompletableFuture<AppResult<Conversation>> createConversation(
            ConversationType type,
            String name,
            String createdBy,
            List<String> members
    ) {
        List<ConversationMemberCommand> memberCommands = new ArrayList<>();
        memberCommands.add(new ConversationMemberCommand(createdBy, MemberRole.ADMIN));
        for (String memberId : members) {
            memberCommands.add(new ConversationMemberCommand(memberId, MemberRole.MEMBER));
        }

        return conversationRepository.createConversation(
                new ConversationCreateCommand(
                        type,
                        name,
                        createdBy,
                        memberCommands
                )
        );
    }

    public CompletableFuture<AppResult<List<RecentUserChat>>> getRecentUserChat() {
        return conversationRepository.getRecentUserChat();
    }
}
