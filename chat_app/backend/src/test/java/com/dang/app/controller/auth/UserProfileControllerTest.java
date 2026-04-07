package com.dang.app.controller.auth;

import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfilePresenceResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.service.auth.UserProfileService;
import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.enums.Gender;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserProfileService userProfileService;

    @Test
    void getPublicProfileByUserId_shouldReturn200_whenProfileExists() throws Exception {
        UUID myId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        authenticateAs(myId);

        when(userProfileService.getPublicProfileByUserId(eq(myId), eq(userId))).thenReturn(
                PublicUserProfileResponse.builder()
                        .userId(userId)
                        .displayName("Alice Nguyen")
                        .avatarUrl("https://cdn.test/avatar.jpg")
                        .friendsCount(12)
                        .phoneNumber("0901234567")
                        .gender(Gender.FEMALE)
                        .birthDate(LocalDate.of(1999, 1, 2))
                        .status(FriendshipStatus.ACCEPTED)
                        .nickname("Alice")
                        .build()
        );

        try {
            mockMvc.perform(get("/api/profiles/public").param("userId", userId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(userId.toString()))
                    .andExpect(jsonPath("$.displayName").value("Alice Nguyen"))
                    .andExpect(jsonPath("$.fullName").doesNotExist())
                    .andExpect(jsonPath("$.avatarUrl").value("https://cdn.test/avatar.jpg"))
                    .andExpect(jsonPath("$.friendsCount").value(12))
                    .andExpect(jsonPath("$.phoneNumber").value("0901234567"))
                    .andExpect(jsonPath("$.gender").value("FEMALE"))
                    .andExpect(jsonPath("$.birthDate").value("1999-01-02"))
                    .andExpect(jsonPath("$.status").value("ACCEPTED"))
                    .andExpect(jsonPath("$.nickname").value("Alice"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void getPublicProfileByUserId_shouldReturn404_whenProfileNotFound() throws Exception {
        UUID myId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        authenticateAs(myId);

        when(userProfileService.getPublicProfileByUserId(eq(myId), eq(userId)))
                .thenThrow(new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        try {
            mockMvc.perform(get("/api/profiles/public").param("userId", userId.toString()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value(ErrorCode.PROFILE_NOT_FOUND.name()));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void getPublicProfileByUserId_shouldReturn400_whenUserIdIsInvalidUuid() throws Exception {
        mockMvc.perform(get("/api/profiles/public").param("userId", "invalid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void getUserProfileSummary_shouldReturn200_whenProfileExists() throws Exception {
        UUID userId = UUID.randomUUID();

        when(userProfileService.getUserProfileSummary(userId)).thenReturn(
                UserProfileSummaryResponse.builder()
                        .userId(userId)
                        .displayName("Alice Nguyen")
                        .avatarUrl("https://cdn.test/avatar.jpg")
                        .build()
        );

        mockMvc.perform(get("/api/profiles/summary").param("userId", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.displayName").value("Alice Nguyen"))
                .andExpect(jsonPath("$.avatarUrl").value("https://cdn.test/avatar.jpg"));
    }

    @Test
    void getUserProfileSummary_shouldReturn404_whenProfileNotFound() throws Exception {
        UUID userId = UUID.randomUUID();

        when(userProfileService.getUserProfileSummary(userId))
                .thenThrow(new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        mockMvc.perform(get("/api/profiles/summary").param("userId", userId.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.PROFILE_NOT_FOUND.name()));
    }

    @Test
    void getUserProfileSummary_shouldReturn400_whenUserIdIsInvalidUuid() throws Exception {
        mockMvc.perform(get("/api/profiles/summary").param("userId", "invalid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void getFriendPresenceList_shouldReturn200_whenFriendsExist() throws Exception {
        UUID myId = UUID.randomUUID();
        UUID friendOnlineId = UUID.randomUUID();
        UUID friendOfflineId = UUID.randomUUID();
        authenticateAs(myId);

        when(userProfileService.getFriendPresenceList(myId)).thenReturn(
                List.of(
                        UserProfilePresenceResponse.builder()
                                .userId(friendOnlineId)
                                .displayName("Online User")
                                .avatarUrl("https://cdn.test/online.jpg")
                                .isOnline(true)
                                .lastSeenAt(null)
                                .build(),
                        UserProfilePresenceResponse.builder()
                                .userId(friendOfflineId)
                                .displayName("Offline User")
                                .avatarUrl("https://cdn.test/offline.jpg")
                                .isOnline(false)
                                .lastSeenAt(LocalDateTime.of(2026, 4, 7, 10, 30, 0))
                                .build()
                )
        );

        try {
            mockMvc.perform(get("/api/profiles/me/friends/presence"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].userId").value(friendOnlineId.toString()))
                    .andExpect(jsonPath("$[0].displayName").value("Online User"))
                    .andExpect(jsonPath("$[0].avatarUrl").value("https://cdn.test/online.jpg"))
                    .andExpect(jsonPath("$[0].online").value(true))
                    .andExpect(jsonPath("$[0].lastSeenAt").doesNotExist())
                    .andExpect(jsonPath("$[1].userId").value(friendOfflineId.toString()))
                    .andExpect(jsonPath("$[1].displayName").value("Offline User"))
                    .andExpect(jsonPath("$[1].avatarUrl").value("https://cdn.test/offline.jpg"))
                    .andExpect(jsonPath("$[1].online").value(false))
                    .andExpect(jsonPath("$[1].lastSeenAt").value("2026-04-07T10:30:00"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void authenticateAs(UUID userId) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .subject(userId.toString())
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }
}
