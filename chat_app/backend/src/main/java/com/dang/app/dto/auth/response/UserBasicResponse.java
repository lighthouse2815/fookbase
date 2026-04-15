package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.Role;
import com.dang.app.utils.enums.Status;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserBasicResponse {
    private UUID id;
    private String username;
    private Role role;
    private Status status;
}
