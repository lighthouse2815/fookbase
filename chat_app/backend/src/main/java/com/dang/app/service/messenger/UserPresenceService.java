package com.dang.app.service.messenger;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class UserPresenceService {

    private final SimpUserRegistry simpUserRegistry;
    private final ConcurrentMap<String, UUID> sessionOwners = new ConcurrentHashMap<>();
    private final ConcurrentMap<UUID, Integer> activeSessionCounts = new ConcurrentHashMap<>();
    private final ConcurrentMap<UUID, LocalDateTime> lastSeenAtByUserId = new ConcurrentHashMap<>();

    public UserPresenceService(SimpUserRegistry simpUserRegistry) {
        this.simpUserRegistry = simpUserRegistry;
    }

    public boolean isOnline(UUID userId) {
        Integer count = activeSessionCounts.get(userId);
        if (count != null && count > 0) {
            return true;
        }

        SimpUser simpUser = simpUserRegistry.getUser(userId.toString());
        return simpUser != null && !simpUser.getSessions().isEmpty();
    }

    public LocalDateTime getLastSeenAt(UUID userId) {
        return lastSeenAtByUserId.get(userId);
    }

    @EventListener
    public void onSessionConnect(SessionConnectEvent event) {
        UUID userId = extractUserId(event.getUser());
        if (userId == null) {
            return;
        }

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            return;
        }

        UUID existingOwner = sessionOwners.putIfAbsent(sessionId, userId);
        if (existingOwner == null) {
            activeSessionCounts.merge(userId, 1, Integer::sum);
        }

        lastSeenAtByUserId.remove(userId);
    }

    @EventListener
    public void onSessionDisconnect(SessionDisconnectEvent event) {
        UUID userId = sessionOwners.remove(event.getSessionId());
        if (userId == null) {
            userId = extractUserId(event.getUser());
        }

        if (userId == null) {
            return;
        }

        activeSessionCounts.compute(userId, (ignored, count) -> {
            if (count == null || count <= 1) {
                return null;
            }
            return count - 1;
        });

        if (!isOnline(userId)) {
            lastSeenAtByUserId.put(userId, LocalDateTime.now());
        }
    }

    private UUID extractUserId(Principal principal) {
        if (principal == null) {
            return null;
        }

        try {
            return UUID.fromString(principal.getName());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
