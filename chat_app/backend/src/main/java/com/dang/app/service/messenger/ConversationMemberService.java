package com.dang.app.service.messenger;

import com.dang.app.service.auth.UserService;
import com.dang.app.utils.enums.ConversationType;
import com.dang.app.dto.messenger.request.ConversationMemberRequest;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.Conversation;
import com.dang.app.entity.messenger.ConversationMember;
import com.dang.app.repository.messenger.ConversationMemberRepository;
import com.dang.app.repository.projection.messenger.RecentUserChatInfoProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.dang.app.utils.enums.MemberRole;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationMemberService {

    private final UserService userService;

    private final ConversationMemberRepository conversationMemberRepository;


    public List<ConversationMember> createConversationMember(
            Conversation conversation,
            List<ConversationMemberRequest> memberRequests
    ) {
        Set<UUID> uniqueMemberIds = memberRequests.stream()
                .map(ConversationMemberRequest::getUserId)
                .collect(Collectors.toSet());

        List<ConversationMember> members = uniqueMemberIds.stream()
                .map(userId -> {
                    User user = userService.findById(userId);

                    ConversationMemberRequest req = memberRequests.stream()
                            .filter(r -> r.getUserId().equals(userId))
                            .findFirst()
                            .orElseThrow();

                    return ConversationMember.builder()
                            .conversation(conversation)
                            .user(user)
                            .role(req.getRole())
                            .build();
                })
                .toList();

        return conversationMemberRepository.saveAll(members);
    }

    public Map<UUID, UUID> getOtherUserIdMapInPrivateConversations(
            Set<UUID> conversationIds,
            UUID currentUserId
    ) {
        if (conversationIds == null || conversationIds.isEmpty()) {
            return Map.of();
        }

        return conversationMemberRepository
                .findOtherUserIdsInConversations(conversationIds, currentUserId, ConversationType.PRIVATE)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0], // conversationId
                        row -> (UUID) row[1]  // otherUserId
                ));
    }

    public Optional<UUID> getOtherUserIdInPrivateConversation(UUID conversationId, UUID currentUserId) {
        return getOtherUserIdMapInPrivateConversations(Set.of(conversationId), currentUserId)
                .values()
                .stream()
                .findFirst();
    }

    public List<RecentUserChatInfoProjection> getMemberInfoByUserIdAndConversationType(
            UUID userId,
            ConversationType type
    ) {
        return conversationMemberRepository.findMemberInfoByUserIdAndConversationType(userId, type);
    }

    public List<RecentUserChatInfoProjection> getPrivateMemberInfoByUserId(UUID userId) {
        return getMemberInfoByUserIdAndConversationType(userId, ConversationType.PRIVATE);
    }

    public Optional<Conversation> findExistingPrivateConversationByUserIds(Set<UUID> userIds) {
        if (userIds == null || userIds.size() != 2) {
            return Optional.empty();
        }

        List<UUID> sortedUserIds = userIds.stream().sorted().toList();
        UUID firstUserId = sortedUserIds.get(0);
        UUID secondUserId = sortedUserIds.get(1);

        List<Conversation> existingConversations =
                conversationMemberRepository.findExistingConversationsByTwoUsersAndType(
                        firstUserId,
                        secondUserId,
                        ConversationType.PRIVATE
                );

        if (existingConversations.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(existingConversations.get(0));
    }

    public List<User> findActiveMembersExcludingUser(UUID conversationId, UUID excludedUserId) {
        return conversationMemberRepository.findActiveUsersByConversationIdExcludingUserId(
                conversationId,
                excludedUserId
        );
    }

    public Optional<ConversationMember> findByConversationIdAndUserId(UUID conversationId, UUID userId) {
        return conversationMemberRepository.findByConversation_IdAndUser_Id(conversationId, userId);
    }

    public Optional<ConversationMember> findActiveMember(UUID conversationId, UUID userId) {
        return conversationMemberRepository.findByConversation_IdAndUser_IdAndLeftAtIsNull(conversationId, userId);
    }

    public long countActiveMembers(UUID conversationId) {
        return conversationMemberRepository.countByConversation_IdAndLeftAtIsNull(conversationId);
    }

    public long countActiveAdmins(UUID conversationId) {
        return conversationMemberRepository.countByConversation_IdAndLeftAtIsNullAndRole(
                conversationId,
                MemberRole.ADMIN
        );
    }

    public ConversationMember save(ConversationMember member) {
        return conversationMemberRepository.save(member);
    }



}

