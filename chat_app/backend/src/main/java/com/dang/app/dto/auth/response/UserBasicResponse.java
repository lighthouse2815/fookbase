package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserBasicResponse {
    private UUID id;
    private String username;
}
