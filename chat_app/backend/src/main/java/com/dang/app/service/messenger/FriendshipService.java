package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.request.FriendshipRequest;
import com.dang.app.dto.messenger.response.BlockedUserResponse;
import com.dang.app.dto.messenger.response.FriendSuggestionResponse;
import com.dang.app.dto.messenger.response.FriendshipResponse;
import com.dang.app.dto.messenger.response.PendingFriendRequesterResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.messenger.FriendshipRepository;
import com.dang.app.service.auth.UserProfileService;
import com.dang.app.service.auth.UserService;
import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.mapper.FriendshipMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final UserService userService;
    private final ContactService contactService;
    private final UserProfileService userProfileService;
    private final FriendshipRepository friendshipRepository;
    private final FriendshipMapper friendshipMapper;

    @Transactional
    public FriendshipResponse sendFriendRequest(UUID userId, FriendshipRequest request) {
        if (userId.equals(request.getUserId())) {
            throw new BusinessException(ErrorCode.CANNOT_FRIEND_SELF);
        }

        User requester = userService.findById(userId);
        User addressee = userService.findById(request.getUserId());

        Friendship friendship = friendshipRepository
                .findBetween(userId, request.getUserId())
                .orElse(null);

        if (friendship != null) {
            switch (friendship.getStatus()) {
                case ACCEPTED -> throw new BusinessException(ErrorCode.ALREADY_FRIENDS);
                case BLOCKED -> throw new BusinessException(ErrorCode.USER_BLOCKED);
                case PENDING -> {
                    if (friendship.getRequester().getId().equals(userId)) {
                        throw new BusinessException(ErrorCode.FRIEND_REQUEST_ALREADY_SENT);
                    }
                    throw new BusinessException(ErrorCode.FRIEND_REQUEST_ALREADY_RECEIVED);
                }
                case REJECTED -> {
                    friendship.setRequester(requester);
                    friendship.setAddressee(addressee);
                    friendship.setStatus(FriendshipStatus.PENDING);
                }
            }
        } else {
            UUID userLow = userId.compareTo(request.getUserId()) < 0 ? userId : request.getUserId();
            UUID userHigh = userId.compareTo(request.getUserId()) > 0 ? userId : request.getUserId();

            friendship = Friendship.builder()
                    .userHighId(userHigh)
                    .userLowId(userLow)
                    .requester(requester)
                    .addressee(addressee)
                    .status(FriendshipStatus.PENDING)
                    .build();
            friendshipRepository.save(friendship);
        }

        String displayName = userProfileService
                .getDisplayNameMap(Set.of(request.getUserId()))
                .get(request.getUserId());

        return friendshipMapper.toResponse(friendship, request.getUserId(), displayName);
    }

    @Transactional
    public FriendshipResponse acceptFriendRequest(UUID userId, FriendshipRequest request) {
        Friendship friendship = getPendingFriendshipForAddressee(userId, request.getUserId());
        friendship.setStatus(FriendshipStatus.ACCEPTED);

        UUID friendId = friendship.getRequester().getId();
        String displayName = userProfileService
                .getDisplayNameMap(Set.of(friendId))
                .get(friendId);

        contactService.createContact(userId, friendId);

        return friendshipMapper.toResponse(friendship, friendId, displayName);
    }

    @Transactional
    public void rejectFriendRequest(UUID userId, FriendshipRequest request) {
        Friendship friendship = getPendingFriendshipForParticipant(userId, request.getUserId());
        friendship.setStatus(FriendshipStatus.REJECTED);
    }

    @Transactional
    public void blockUser(UUID userId, UUID targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_BLOCK_SELF);
        }

        User blocker = userService.findById(userId);
        User blocked = userService.findById(targetUserId);

        Friendship friendship = friendshipRepository
                .findBetween(userId, targetUserId)
                .orElse(null);

        if (friendship == null) {
            UUID userLow = userId.compareTo(targetUserId) < 0 ? userId : targetUserId;
            UUID userHigh = userId.compareTo(targetUserId) > 0 ? userId : targetUserId;

            friendship = Friendship.builder()
                    .userLowId(userLow)
                    .userHighId(userHigh)
                    .requester(blocker)
                    .addressee(blocked)
                    .status(FriendshipStatus.BLOCKED)
                    .build();
            friendshipRepository.save(friendship);
        } else {
            friendship.setStatus(FriendshipStatus.BLOCKED);
            friendship.setRequester(blocker);
            friendship.setAddressee(blocked);
        }

        // Block always implies unfriend in both directions.
        contactService.deleteContact(userId, targetUserId);
    }

    @Transactional
    public void unblockUser(UUID userId, UUID targetUserId) {
        Friendship friendship = friendshipRepository.findBetween(userId, targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIENDSHIP_NOT_FOUND));

        if (friendship.getStatus() != FriendshipStatus.BLOCKED) {
            throw new BusinessException(ErrorCode.INVALID_FRIENDSHIP_STATUS);
        }

        if (!friendship.getRequester().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional
    public void unfriend(UUID userId, FriendshipRequest request) {
        Friendship friendship = friendshipRepository.findBetween(userId, request.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIENDSHIP_NOT_FOUND));

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new BusinessException(ErrorCode.INVALID_FRIENDSHIP_STATUS);
        }

        contactService.deleteContact(
                friendship.getRequester().getId(),
                friendship.getAddressee().getId()
        );

        friendshipRepository.delete(friendship);
    }

    public boolean isBlockedBetween(UUID userId, UUID otherUserId) {
        if (userId == null || otherUserId == null || userId.equals(otherUserId)) {
            return false;
        }

        return friendshipRepository.findStatusBetween(userId, otherUserId)
                .map(status -> status == FriendshipStatus.BLOCKED)
                .orElse(false);
    }

    public Set<UUID> getBlockedUserIdSet(UUID userId) {
        return friendshipRepository.findBlockedFriendshipsByUserId(userId)
                .stream()
                .map(friendship -> resolveOtherUserId(friendship, userId))
                .collect(Collectors.toSet());
    }

    public List<BlockedUserResponse> getBlockedUserInfos(UUID userId) {
        userService.findById(userId);

        List<Friendship> blockedFriendships = friendshipRepository.findBlockedFriendshipsByUserId(userId)
                .stream()
                .filter(friendship -> friendship.getRequester().getId().equals(userId))
                .toList();
        if (blockedFriendships.isEmpty()) {
            return List.of();
        }

        Set<UUID> otherUserIds = blockedFriendships.stream()
                .map(friendship -> resolveOtherUserId(friendship, userId))
                .collect(Collectors.toSet());

        Map<UUID, UserProfile> profileMap =
                userProfileService.getProfileMapByUserIds(new ArrayList<>(otherUserIds));

        return blockedFriendships.stream()
                .map(friendship -> {
                    UUID otherUserId = resolveOtherUserId(friendship, userId);
                    User otherUser = friendship.getRequester().getId().equals(userId)
                            ? friendship.getAddressee()
                            : friendship.getRequester();
                    UserProfile otherProfile = profileMap.get(otherUserId);
                    LocalDateTime blockedAt = friendship.getUpdatedAt() != null
                            ? friendship.getUpdatedAt()
                            : friendship.getCreatedAt();

                    return friendshipMapper.toBlockedUserResponse(
                            otherUserId,
                            resolveDisplayName(otherUser, otherProfile),
                            otherProfile == null ? null : otherProfile.getAvatarUrl(),
                            blockedAt
                    );
                })
                .toList();
    }

    public List<PendingFriendRequesterResponse> getPendingRequesterInfos(UUID userId) {
        userService.findById(userId);

        List<Friendship> friendships = friendshipRepository.findPendingFriendshipsByUserId(userId);
        if (friendships.isEmpty()) {
            return List.of();
        }

        Set<UUID> otherUserIds = friendships.stream()
                .map(friendship -> friendship.getRequester().getId().equals(userId)
                        ? friendship.getAddressee().getId()
                        : friendship.getRequester().getId())
                .collect(Collectors.toSet());

        Map<UUID, UserProfile> profileMap =
                userProfileService.getProfileMapByUserIds(new ArrayList<>(otherUserIds));

        return friendships.stream()
                .map(friendship -> {
                    boolean isRequester = friendship.getRequester().getId().equals(userId);
                    User otherUser = isRequester ? friendship.getAddressee() : friendship.getRequester();
                    UserProfile otherProfile = profileMap.get(otherUser.getId());

                    return friendshipMapper.toPendingFriendRequesterResponse(
                            otherUser.getId(),
                            resolveDisplayName(otherUser, otherProfile),
                            otherProfile == null ? null : otherProfile.getAvatarUrl(),
                            isRequester,
                            friendship.getCreatedAt()
                    );
                })
                .toList();
    }

    public List<FriendSuggestionResponse> getFriendSuggestions(UUID userId, Pageable pageable) {
        userService.findById(userId);

        int safePage = Math.max(pageable.getPageNumber(), 0);
        int safeSize = Math.min(Math.max(pageable.getPageSize(), 1), 50);
        Pageable safePageable = PageRequest.of(safePage, safeSize);

        return friendshipRepository.findFriendSuggestions(userId, safePageable)
                .stream()
                .map(friendshipMapper::toFriendSuggestionResponse)
                .toList();
    }

    private Friendship getPendingFriendshipForAddressee(UUID userId, UUID otherUserId) {
        Friendship friendship = friendshipRepository.findBetween(userId, otherUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_FRIEND_REQUEST_STATUS);
        }

        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        return friendship;
    }

    private Friendship getPendingFriendshipForParticipant(UUID userId, UUID otherUserId) {
        Friendship friendship = friendshipRepository.findBetween(userId, otherUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_FRIEND_REQUEST_STATUS);
        }

        UUID requesterId = friendship.getRequester().getId();
        UUID addresseeId = friendship.getAddressee().getId();

        if (!requesterId.equals(userId) && !addresseeId.equals(userId)) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        return friendship;
    }

    private UUID resolveOtherUserId(Friendship friendship, UUID userId) {
        return friendship.getRequester().getId().equals(userId)
                ? friendship.getAddressee().getId()
                : friendship.getRequester().getId();
    }

    private String resolveDisplayName(User user, UserProfile profile) {
        if (profile != null && profile.getDisplayName() != null) {
            return profile.getDisplayName();
        }
        return user.getUsername();
    }
}
