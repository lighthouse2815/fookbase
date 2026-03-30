package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.enums.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;
    private Gender gender;
    private LocalDate birthDate;

    private FriendshipStatus status;

    private String nickname;
}
