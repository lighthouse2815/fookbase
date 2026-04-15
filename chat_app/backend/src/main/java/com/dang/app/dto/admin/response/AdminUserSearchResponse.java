package com.dang.app.dto.admin.response;

import com.dang.app.utils.enums.Role;
import com.dang.app.utils.enums.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminUserSearchResponse {
    private UUID userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String email;
    private String phoneNumber;
    private Role role;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

