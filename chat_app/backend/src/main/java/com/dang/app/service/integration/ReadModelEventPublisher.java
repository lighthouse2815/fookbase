package com.dang.app.service.integration;

import com.dang.app.entity.readmodel.ReadModelEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadModelEventPublisher {

    private static final String PROFILE_UPDATED = "user.profile.updated";
    private static final String USER_BLOCKED = "user.blocked";
    private static final String USER_UNBLOCKED = "user.unblocked";
    private static final String FRIENDSHIP_ACCEPTED = "friendship.accepted";
    private static final String FRIENDSHIP_REMOVED = "friendship.removed";
    private static final String PRESENCE_CHANGED = "presence.changed";

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.read-model-events.enabled:false}")
    private boolean enabled;

    @Value("${app.read-model-events.exchange:fookbase.domain.events}")
    private String exchangeName;

    public void publishProfileUpdated(UUID userId, String displayName, String avatarUrl) {
        publishAfterCommit(
                PROFILE_UPDATED,
                Map.of(
                        "userId", userId,
                        "displayName", normalize(displayName, "user"),
                        "avatarUrl", normalize(avatarUrl, "")
                )
        );
    }

    public void publishUserBlocked(UUID ownerUserId, UUID blockedUserId) {
        publishAfterCommit(
                USER_BLOCKED,
                Map.of(
                        "ownerUserId", ownerUserId,
                        "blockedUserId", blockedUserId,
                        "isBlocked", true
                )
        );
    }

    public void publishUserUnblocked(UUID ownerUserId, UUID blockedUserId) {
        publishAfterCommit(
                USER_UNBLOCKED,
                Map.of(
                        "ownerUserId", ownerUserId,
                        "blockedUserId", blockedUserId,
                        "isBlocked", false
                )
        );
    }

    public void publishFriendshipAccepted(UUID firstUserId, UUID secondUserId) {
        publishFriendshipState(FRIENDSHIP_ACCEPTED, firstUserId, secondUserId, true, "accepted");
    }

    public void publishFriendshipRemoved(UUID firstUserId, UUID secondUserId) {
        publishFriendshipState(FRIENDSHIP_REMOVED, firstUserId, secondUserId, false, "removed");
    }

    public void publishPresenceChanged(UUID userId, boolean isOnline, LocalDateTime lastSeenAt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("isOnline", isOnline);
        payload.put("status", isOnline ? "online" : "offline");

        if (lastSeenAt != null) {
            payload.put("lastSeenAt", lastSeenAt.toString());
        }

        publishAfterCommit(PRESENCE_CHANGED, payload);
    }

    private void publishFriendshipState(
            String eventType,
            UUID firstUserId,
            UUID secondUserId,
            boolean isActive,
            String status
    ) {
        publishAfterCommit(
                eventType,
                Map.of(
                        "firstUserId", firstUserId,
                        "secondUserId", secondUserId,
                        "isActive", isActive,
                        "status", status
                )
        );
    }

    private void publishAfterCommit(String eventType, Map<String, Object> payload) {
        if (!enabled) {
            return;
        }

        Runnable publishAction = () -> publish(eventType, payload);
        if (TransactionSynchronizationManager.isSynchronizationActive()
                && TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publishAction.run();
                }
            });
            return;
        }

        publishAction.run();
    }

    private void publish(String eventType, Map<String, Object> payload) {
        try {
            ReadModelEvent event = new ReadModelEvent(eventType, Instant.now(), payload);
            rabbitTemplate.convertAndSend(exchangeName, eventType, event);
        } catch (Exception exception) {
            log.warn("Could not publish read-model event. eventType={}", eventType, exception);
        }
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value.trim();
    }
}
