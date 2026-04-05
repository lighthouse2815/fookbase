package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserProfileSummaryResponse {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
}
