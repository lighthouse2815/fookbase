package com.dang.app.controller.messenger;

import com.dang.app.dto.messenger.request.FriendshipRequest;
import com.dang.app.dto.messenger.response.BlockedUserResponse;
import com.dang.app.dto.messenger.response.FriendshipResponse;
import com.dang.app.dto.messenger.response.PendingFriendRequesterResponse;
import com.dang.app.service.messenger.FriendshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messenger/friendships")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @PostMapping
    public FriendshipResponse sendFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid FriendshipRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return friendshipService.sendFriendRequest(userId, request);
    }

    @PostMapping("/accept")
    public FriendshipResponse acceptFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid FriendshipRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return friendshipService.acceptFriendRequest(
                userId,
                request
        );
    }

    @GetMapping("/pending-requesters")
    public List<PendingFriendRequesterResponse> getPendingRequesters(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return friendshipService.getPendingRequesterInfos(userId);
    }

    @GetMapping("/blocked-users")
    public List<BlockedUserResponse> getBlockedUsers(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return friendshipService.getBlockedUserInfos(userId);
    }

    @GetMapping("/blocked-user-ids")
    public List<UUID> getBlockedUserIds(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return friendshipService.getBlockedUserIdSet(userId)
                .stream()
                .toList();
    }

    @PostMapping("/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectFriendRequest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid FriendshipRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        friendshipService.rejectFriendRequest(
                userId,
                request
        );
    }

    @PostMapping("/block/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void blockUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID targetUserId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        friendshipService.blockUser(
                userId,
                targetUserId
        );
    }

    @DeleteMapping("/block/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID targetUserId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        friendshipService.unblockUser(userId, targetUserId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfriend(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid FriendshipRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        friendshipService.unfriend(
                userId,
                request
        );
    }
}

