package com.dang.app.controller.messenger;

import com.dang.app.dto.messenger.request.SendMessageRequest;
import com.dang.app.dto.messenger.response.MessageCursorPageResponse;
import com.dang.app.dto.messenger.response.MessageResponse;
import com.dang.app.service.messenger.MessageService;
import com.dang.app.service.messenger.ChatRealTimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/messenger/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final ChatRealTimeService chatRealTimeService;

    @PostMapping(
            value = {"/send", "/sendWithText"},
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID senderId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                chatRealTimeService.sendMessageRest(request, senderId)
        );
    }

    @MessageMapping("/chat.send")
    public void sendMessageRealTime(
            @Valid @Payload SendMessageRequest request,
            Principal principal
    ) {
        if (!(principal instanceof JwtAuthenticationToken jwtAuthenticationToken)) {
            throw new AccessDeniedException("Unauthenticated STOMP session");
        }

        UUID senderId = UUID.fromString(jwtAuthenticationToken.getToken().getSubject());

        chatRealTimeService.sendRealTimeMessage(request, senderId);
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<MessageCursorPageResponse> getMessages(
            @PathVariable UUID conversationId,
            @RequestParam(required = false) Instant cursorCreatedAt,
            @RequestParam(required = false) UUID cursorMessageId,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                messageService.getMessages(conversationId, userId, cursorCreatedAt, cursorMessageId, limit)
        );
    }
}
