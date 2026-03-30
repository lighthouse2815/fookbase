package com.dang.app.dto.messenger.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class MessageCursor {

    private Instant createdAt;
    private UUID messageId;
}
