package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSecurityPrivateResponse {
    private String username;
    private String email;
    private String phoneNumber;
}
