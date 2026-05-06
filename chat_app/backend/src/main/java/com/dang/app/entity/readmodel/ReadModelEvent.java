package com.dang.app.entity.readmodel;

import java.time.Instant;
import java.util.Map;

public record ReadModelEvent(
        String eventType,
        Instant occurredAt,
        Map<String, Object> payload
) {
}
