package com.dang.app.dto.auth.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class RegisterResponse {
    private String username;
    private String message;
}
