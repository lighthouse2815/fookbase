package com.dang.app.controller.messenger;

import com.dang.app.dto.messenger.request.ConversationCreateRequest;
import com.dang.app.dto.messenger.request.ConversationUpdateRequest;
import com.dang.app.dto.messenger.response.RecentUserChatResponse;
import com.dang.app.dto.messenger.response.ConversationResponse;
import com.dang.app.service.messenger.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messenger/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping("/create")
    public ResponseEntity<?> createConversation(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid ConversationCreateRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.createConversation(request,userId);
        return ResponseEntity.status(HttpStatus.CREATED).body("ok");
    }

    @GetMapping("/getByUser")
    public ResponseEntity<List<ConversationResponse>> getConversationByUser(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                conversationService.getConversationsByUser(userId)
        );
    }

    @GetMapping("/getGroupByUser")
    public ResponseEntity<List<ConversationResponse>> getAllGroups(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                conversationService.getAllGroups(userId)
        );
    }

    @GetMapping("/getRecentUserChat")
    public ResponseEntity<List<RecentUserChatResponse>> getRecentUserChat(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                conversationService.getRecentUserChat(userId)
        );
    }

    @DeleteMapping("/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConversation(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.deleteConversation(conversationId, userId);
    }

    @PatchMapping("/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateConversation(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @RequestBody @Valid ConversationUpdateRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.updateConversation(conversationId, userId, request);
    }

    @PostMapping("/{conversationId}/members/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @PathVariable UUID targetUserId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.addMember(conversationId, userId, targetUserId);
    }

    @DeleteMapping("/{conversationId}/members/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @PathVariable UUID targetUserId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.removeMember(conversationId, userId, targetUserId);
    }

    @PostMapping("/{conversationId}/admins/{targetUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addAdmin(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @PathVariable UUID targetUserId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.addAdmin(conversationId, userId, targetUserId);
    }

    @PostMapping("/{conversationId}/admins/me/demote")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void selfDemoteAdmin(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        conversationService.selfDemoteAdmin(conversationId, userId);
    }



}
