package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.Status;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class GoogleAuthResponse {

    @NotBlank
    private String accessToken;

    private String refreshToken;

    private String tokenType;

    private UUID userId;

    private String displayName;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private String avatarUrl;

    private LocalDate birthDate;

    private String gender;

    private Boolean profileCompleted;

    private Status status;

    private boolean isNew;
}
