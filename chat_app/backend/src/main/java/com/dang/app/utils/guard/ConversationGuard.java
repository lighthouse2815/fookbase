package com.dang.app.utils.guard;

import com.dang.app.repository.messenger.ConversationMemberRepository;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@Component
@RequiredArgsConstructor
public class ConversationGuard {

    private final ConversationMemberRepository conversationMemberRepository;

    public void requireActiveMember(UUID conversationId, UUID memberId) {
        boolean isMember = conversationMemberRepository.existsActiveMember(conversationId, memberId);

        if (!isMember) {
            throw new BusinessException(ErrorCode.SENDER_NOT_IN_CONVERSATION);
        }
    }
}
