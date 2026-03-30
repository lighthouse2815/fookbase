package com.dang.app.dto.auth.response;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserProfileOverviewResponse {

    private String displayName;
    private String phoneNumber;
    private String email;
    private LocalDate birthDate;

}
