package com.dangngulon.frontend.feature.zola.data.mapper;

import com.dangngulon.frontend.core.utils.AvatarDefaults;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.ConversationCreateRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.ConversationMemberRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.ConversationResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.RecentUserChatResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationCreateCommand;
import com.dangngulon.frontend.feature.zola.domain.model.ConversationMemberCommand;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class ConversationDataMapper {

    private ConversationDataMapper() {
    }

    public static ConversationCreateRequest toRequest(ConversationCreateCommand command) {
        if (command == null) {
            return null;
        }

        return new ConversationCreateRequest(
                command.getType(),
                command.getName(),
                command.getCreatedBy(),
                toRequestMembers(command.getMembers())
        );
    }

    public static Conversation toDomain(ConversationResponse response) {
        if (response == null) {
            return null;
        }

        return new Conversation(
                response.getConversationId(),
                response.getName(),
                AvatarDefaults.resolve(response.getAvatarUrl()),
                response.getType(),
                response.getLastSenderId(),
                response.getLastMessagePreview(),
                response.getLastSenderName(),
                response.getLastMessageAt(),
                response.getUnreadCount(),
                response.isHasUnread(),
                response.getMemberCount()
        );
    }

    public static List<Conversation> toDomainList(List<ConversationResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(ConversationDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static RecentUserChat toDomain(RecentUserChatResponse response) {
        if (response == null) {
            return null;
        }

        return new RecentUserChat(
                response.getUserId(),
                response.getUsername(),
                AvatarDefaults.resolve(response.getAvatar()),
                response.getLastChatTime()
        );
    }

    public static List<RecentUserChat> toRecentUserChatDomainList(List<RecentUserChatResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(ConversationDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private static List<ConversationMemberRequest> toRequestMembers(List<ConversationMemberCommand> commands) {
        if (commands == null || commands.isEmpty()) {
            return Collections.emptyList();
        }

        return commands.stream()
                .map(value -> new ConversationMemberRequest(value.getUserId(), value.getRole()))
                .collect(Collectors.toList());
    }
}
