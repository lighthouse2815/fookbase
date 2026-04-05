package com.dang.app.controller.auth;

import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.service.auth.UserProfileService;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

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
        UUID userId = UUID.randomUUID();

        when(userProfileService.getPublicProfileByUserId(userId)).thenReturn(
                PublicUserProfileResponse.builder()
                        .userId(userId)
                        .displayName("Alice Nguyen")
                        .avatarUrl("https://cdn.test/avatar.jpg")
                        .build()
        );

        mockMvc.perform(get("/api/profiles/public").param("userId", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.displayName").value("Alice Nguyen"))
                .andExpect(jsonPath("$.fullName").doesNotExist())
                .andExpect(jsonPath("$.avatarUrl").value("https://cdn.test/avatar.jpg"));
    }

    @Test
    void getPublicProfileByUserId_shouldReturn404_whenProfileNotFound() throws Exception {
        UUID userId = UUID.randomUUID();

        when(userProfileService.getPublicProfileByUserId(userId))
                .thenThrow(new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        mockMvc.perform(get("/api/profiles/public").param("userId", userId.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.PROFILE_NOT_FOUND.name()));
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
}
