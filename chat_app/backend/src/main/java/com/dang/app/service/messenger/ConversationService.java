package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.response.RecentUserChatResponse;
import com.dang.app.entity.messenger.Message;
import com.dang.app.service.auth.UserService;
import com.dang.app.utils.enums.ConversationType;
import com.dang.app.utils.enums.MemberRole;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.dto.messenger.request.ConversationCreateRequest;
import com.dang.app.dto.messenger.request.ConversationMemberRequest;
import com.dang.app.dto.messenger.request.ConversationUpdateRequest;
import com.dang.app.dto.messenger.response.ConversationResponse;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.Conversation;
import com.dang.app.entity.messenger.ConversationMember;
import com.dang.app.repository.messenger.ConversationRepository;
import com.dang.app.repository.projection.messenger.RecentUserChatInfoProjection;
import com.dang.app.service.auth.UserProfileService;
import com.dang.app.utils.guard.ConversationGuard;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.mapper.ConversationMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final UserService userService;
    private final MessageStatusService messageStatusService;
    private final UserProfileService userProfileService;
    private final ConversationMemberService conversationMemberService;
    private final FriendshipService friendshipService;

    private final ConversationRepository conversationRepository;

    private final ConversationMapper conversationMapper;

    private final ConversationGuard conversationGuard;
    private final UserGuard userGuard;


    /**
     * Hàm tạo cuộc trò chuyện (Group - Private)
     * 1. Kiểm tra điều kiện : member >= 2, người gửi request là member,
     * tất cả member tồn tại, điều kiện về tên (private không có tên)
     * 2. Khởi tạo ConversationMember
     */
    @Transactional
    public Conversation createConversation(ConversationCreateRequest request, UUID userId) {
        Set<UUID> memberIds = request.getMembers()
                .stream()
                .map(ConversationMemberRequest::getUserId)
                .collect(Collectors.toSet());

        if (memberIds.size() < 2) {
            throw new BusinessException(ErrorCode.INVALID_MEMBER_COUNT);
        }

        if (!memberIds.contains(userId)) {
            throw new BusinessException(ErrorCode.CREATOR_NOT_IN_MEMBER);
        }

        List<User> users = userService.findAllById(memberIds);
        if (users.size() != memberIds.size()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        boolean isPrivate = memberIds.size() == 2;
        if (isPrivate && request.getName() != null && !request.getName().isBlank()) {
            throw new BusinessException(ErrorCode.PRIVATE_CONVERSATION_HAS_NAME);
        }

        if (isPrivate) {
            UUID otherUserId = memberIds.stream()
                    .filter(memberId -> !memberId.equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

            if (friendshipService.isBlockedBetween(userId, otherUserId)) {
                throw new BusinessException(ErrorCode.USER_BLOCKED);
            }
        }

        if (request.getType() == ConversationType.PRIVATE && isPrivate) {
            Optional<Conversation> existingPrivateConversation =
                    conversationMemberService.findExistingPrivateConversationByUserIds(memberIds);

            if (existingPrivateConversation.isPresent()) {
                return existingPrivateConversation.get();
            }
        }

        User creator = userService.findById(userId);

        Conversation conversation = conversationRepository.save(
                Conversation.builder()
                        .name(request.getName())
                        .type(request.getType())
                        .createdBy(creator)
                        .build()
        );

        conversationMemberService.createConversationMember(conversation, request.getMembers());

        return conversation;
    }


    /*
    * Hàm lấy tất cả cuộc trò chuyện
    * **/
    public List<ConversationResponse> getConversationsByUser(UUID userId) {
        List<Conversation> conversations =
                conversationRepository.findVisibleByUserId(userId);

        if (conversations.isEmpty()) {
            return List.of();
        }

        Set<UUID> blockedUserIds = friendshipService.getBlockedUserIdSet(userId);

        Set<UUID> conversationIds = conversations.stream()
                .map(Conversation::getId)
                .collect(Collectors.toSet());

        Map<UUID, UUID> otherUserMap =
                conversationMemberService
                        .getOtherUserIdMapInPrivateConversations(conversationIds, userId);

        List<Conversation> visibleConversations = conversations.stream()
                .filter(conversation -> !isPrivateConversationBlocked(conversation, blockedUserIds, otherUserMap))
                .toList();

        if (visibleConversations.isEmpty()) {
            return List.of();
        }

        List<Conversation> sortedVisibleConversations = visibleConversations.stream()
                .sorted(Comparator
                        .comparing(this::resolveConversationSortTime)
                        .reversed())
                .toList();

        Set<UUID> privateOtherUserIds = sortedVisibleConversations.stream()
                .filter(conversation -> conversation.getType() == ConversationType.PRIVATE)
                .map(Conversation::getId)
                .map(otherUserMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));

        Map<UUID, UserProfile> profileMap = privateOtherUserIds.isEmpty()
                ? Map.of()
                : userProfileService.getProfileMapByUserIds(new ArrayList<>(privateOtherUserIds));

        // map tat ca display name
        Map<UUID, String> displayNameMap = profileMap.values().stream()
                .collect(Collectors.toMap(
                        profile -> profile.getUser().getId(),
                        UserProfile::getDisplayName,
                        (left, ignored) -> left
                ));

        // map tat ca avatar cua private conversation
        Map<UUID, String> avatarMap = profileMap.values().stream()
                .collect(Collectors.toMap(
                        profile -> profile.getUser().getId(),
                        UserProfile::getAvatarUrl,
                        (left, ignored) -> left
                ));

        // map tat ca tin nhan chua doc cua user
        Map<UUID, Integer> unreadMap = messageStatusService.getUnreadCountMap(userId);

        return sortedVisibleConversations.stream()
                .map(conversation -> conversationMapper.toResponse(
                        conversation,
                        unreadMap,
                        otherUserMap,
                        displayNameMap,
                        avatarMap)
                )
                .toList();
    }


    /*
    * Hàm lấy tất cả Group
    * **/
    public List<ConversationResponse> getAllGroups(UUID userId){
        List<Conversation> conversations =
                conversationRepository.findVisibleByUserIdAndType(userId, ConversationType.GROUP);

        if (conversations.isEmpty()) {
            return List.of();
        }

        Map<UUID, Integer> unreadMap = messageStatusService.getUnreadCountMap(userId);
        List<Conversation> sortedConversations = conversations.stream()
                .sorted(Comparator
                        .comparing(this::resolveConversationSortTime)
                        .reversed())
                .toList();

        return sortedConversations.stream()
                .map(conversation -> conversationMapper.toResponse(
                        conversation,
                        unreadMap,
                        null,
                        null)
                )
                .toList();
    }

    /*
     * Hàm cập nhật last message
     */
    public void setupLastMessage(Conversation conversation, Message lastMessage, String lastMessagePreview) {
        conversation.setLastMessageId(lastMessage.getId());
        conversation.setLastMessagePreview(lastMessagePreview);
        conversation.setLastSenderId(lastMessage.getSender().getId());
        conversation.setLastMessageAt(lastMessage.getCreatedAt());

        conversationRepository.save(conversation);
    }


    /*
    * Hàm lấy những người đã chat gần đây, dùng trong creategroup
    * **/
    public List<RecentUserChatResponse> getRecentUserChat(UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        List<RecentUserChatInfoProjection> results = conversationMemberService.getPrivateMemberInfoByUserId(userId);
        if (results.isEmpty()) {
            return List.of();
        }

        Set<UUID> blockedUserIds = friendshipService.getBlockedUserIdSet(userId);
        List<RecentUserChatInfoProjection> visibleResults = results.stream()
                .filter(result -> !blockedUserIds.contains(result.getUserId()))
                .toList();

        return conversationMapper.toRecentUserChatResponses(visibleResults);
    }

    public void ensureNoBlockedRelationInPrivateConversation(Conversation conversation, UUID userId) {
        if (conversation.getType() != ConversationType.PRIVATE) {
            return;
        }

        UUID otherUserId = conversationMemberService.getOtherUserIdInPrivateConversation(conversation.getId(), userId)
                .orElse(null);

        if (otherUserId != null && friendshipService.isBlockedBetween(userId, otherUserId)) {
            throw new BusinessException(ErrorCode.USER_BLOCKED);
        }
    }


    public Conversation findById(UUID conversationId) {
        return conversationRepository.findByIdAndDeletedAtIsNull(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND));
    }

    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);

        conversationGuard.requireActiveMember(conversationId, userId);

        conversation.setDeletedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Transactional
    public void updateConversation(UUID conversationId, UUID userId, ConversationUpdateRequest request) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);
        conversationGuard.requireActiveMember(conversationId, userId);

        if (request.getName() != null) {
            String trimmedName = request.getName().trim();

            if (conversation.getType() == ConversationType.PRIVATE && !trimmedName.isEmpty()) {
                throw new BusinessException(ErrorCode.PRIVATE_CONVERSATION_HAS_NAME);
            }

            conversation.setName(trimmedName.isEmpty() ? null : trimmedName);
        }

        if (request.getAvatarUrl() != null) {
            String trimmedAvatar = request.getAvatarUrl().trim();
            conversation.setAvatarUrl(trimmedAvatar.isEmpty() ? null : trimmedAvatar);
        }

        conversationRepository.save(conversation);
    }

    @Transactional
    public void addMember(UUID conversationId, UUID userId, UUID targetUserId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);
        requireGroupConversation(conversation);
        requireAdmin(conversationId, userId);

        User targetUser = userService.findById(targetUserId);
        userGuard.requireActiveAndNotDeleted(targetUser);

        Optional<ConversationMember> existingMember =
                conversationMemberService.findByConversationIdAndUserId(conversationId, targetUserId);

        if (existingMember.isPresent()) {
            ConversationMember member = existingMember.get();

            if (member.getLeftAt() == null) {
                return;
            }

            member.setLeftAt(null);
            member.setRole(MemberRole.MEMBER);
            conversationMemberService.save(member);
            return;
        }

        conversationMemberService.save(
                ConversationMember.builder()
                        .conversation(conversation)
                        .user(targetUser)
                        .role(MemberRole.MEMBER)
                        .build()
        );
    }

    @Transactional
    public void removeMember(UUID conversationId, UUID userId, UUID targetUserId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);
        requireGroupConversation(conversation);

        boolean isSelfRemoval = userId.equals(targetUserId);
        if (isSelfRemoval) {
            conversationGuard.requireActiveMember(conversationId, userId);
        } else {
            requireAdmin(conversationId, userId);
        }

        ConversationMember targetMember = conversationMemberService.findActiveMember(conversationId, targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (targetMember.getRole() == MemberRole.ADMIN) {
            long adminCount = conversationMemberService.countActiveAdmins(conversationId);
            long memberCount = conversationMemberService.countActiveMembers(conversationId);
            if (adminCount <= 1 && memberCount > 1) {
                throw new BusinessException(ErrorCode.NO_PERMISSION);
            }
        }

        targetMember.setLeftAt(LocalDateTime.now());
        conversationMemberService.save(targetMember);
    }

    @Transactional
    public void addAdmin(UUID conversationId, UUID userId, UUID targetUserId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);
        requireGroupConversation(conversation);
        requireAdmin(conversationId, userId);

        ConversationMember targetMember = conversationMemberService.findActiveMember(conversationId, targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        targetMember.setRole(MemberRole.ADMIN);
        conversationMemberService.save(targetMember);
    }

    @Transactional
    public void selfDemoteAdmin(UUID conversationId, UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = findById(conversationId);
        requireGroupConversation(conversation);

        ConversationMember currentMember = conversationMemberService.findActiveMember(conversationId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NO_PERMISSION));

        if (currentMember.getRole() != MemberRole.ADMIN) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        long adminCount = conversationMemberService.countActiveAdmins(conversationId);
        if (adminCount <= 1) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        currentMember.setRole(MemberRole.MEMBER);
        conversationMemberService.save(currentMember);
    }

    private void requireGroupConversation(Conversation conversation) {
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }
    }

    private void requireAdmin(UUID conversationId, UUID userId) {
        ConversationMember currentMember = conversationMemberService.findActiveMember(conversationId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NO_PERMISSION));

        if (currentMember.getRole() != MemberRole.ADMIN) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }
    }

    private boolean isPrivateConversationBlocked(
            Conversation conversation,
            Set<UUID> blockedUserIds,
            Map<UUID, UUID> otherUserMap
    ) {
        if (conversation.getType() != ConversationType.PRIVATE) {
            return false;
        }

        UUID otherUserId = otherUserMap.get(conversation.getId());
        if (otherUserId == null) {
            return false;
        }

        return blockedUserIds.contains(otherUserId);
    }

    private LocalDateTime resolveConversationSortTime(Conversation conversation) {
        if (conversation.getLastMessageAt() != null) {
            return conversation.getLastMessageAt();
        }

        if (conversation.getCreatedAt() != null) {
            return conversation.getCreatedAt();
        }

        return LocalDateTime.MIN;
    }


}

