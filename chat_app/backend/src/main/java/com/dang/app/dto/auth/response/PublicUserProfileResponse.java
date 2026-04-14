package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.enums.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PublicUserProfileResponse {
    private UUID userId;
    private String displayName;
    private String fullName;
    private String avatarUrl;
    private String email;
    private long friendsCount;
    private String phoneNumber;
    private Gender gender;
    private LocalDate birthDate;
    private boolean fullNameVisible;
    private boolean phoneVisible;
    private boolean emailVisible;
    private boolean dateOfBirthVisible;
    private boolean genderVisible;
    private boolean friendCountVisible;

    private FriendshipStatus status;

    private String nickname;
}
