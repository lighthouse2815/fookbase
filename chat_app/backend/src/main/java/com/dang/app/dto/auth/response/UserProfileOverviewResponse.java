package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserProfileOverviewResponse {

    private UUID userId;
    private String username;
    private String displayName;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String email;
    private String avatarUrl;
    private LocalDate birthDate;
    private String gender;
}
