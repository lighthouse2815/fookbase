package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Conversation;
import com.dang.app.utils.enums.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByIdAndDeletedAtIsNull(UUID id);

    List<Conversation> findByMembers_User_IdAndDeletedAtNull(UUID userId);

    List<Conversation>
    findDistinctByMembers_User_IdAndMembers_LeftAtNullAndTypeAndDeletedAtNull(
            UUID userId,
            ConversationType type
    );




}
