package com.dang.app.controller.auth;

import com.dang.app.dto.auth.response.PublicUserProfileResponse;
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

    private void authenticateAs(UUID userId) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .subject(userId.toString())
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }
}
