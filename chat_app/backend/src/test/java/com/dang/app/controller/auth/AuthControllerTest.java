package com.dang.app.controller.auth;

import com.dang.app.dto.auth.request.LoginRequest;
import com.dang.app.dto.auth.response.LoginResponse;
import com.dang.app.dto.auth.response.TokenResponse;
import com.dang.app.service.auth.AuthService;
import com.dang.app.utils.enums.Role;
import com.dang.app.utils.enums.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Test
    void login_shouldReturnTokenAndSetRefreshCookie() throws Exception {
        UUID userId = UUID.randomUUID();
        LoginResponse loginResponse = LoginResponse.builder()
                .token("access-token")
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .tokenType("Bearer")
                .userId(userId)
                .displayName("Alice")
                .role(Role.USER)
                .profileCompleted(true)
                .status(Status.ACTIVE)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);
        when(authService.getRefreshTokenExpirationSeconds()).thenReturn(1209600L);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "alice",
                                  "password": "Secret123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refresh_token=refresh-token")));
    }

    @Test
    void refreshToken_shouldRotateWhenBodyTokenProvided() throws Exception {
        TokenResponse tokenResponse = TokenResponse.builder()
                .accessToken("new-access")
                .refreshToken("new-refresh")
                .tokenType("Bearer")
                .build();

        when(authService.refreshToken("old-refresh")).thenReturn(tokenResponse);
        when(authService.getRefreshTokenExpirationSeconds()).thenReturn(1209600L);

        mockMvc.perform(post("/api/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "old-refresh"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access"))
                .andExpect(jsonPath("$.refreshToken").value("new-refresh"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refresh_token=new-refresh")));
    }

    @Test
    void refreshToken_shouldReadFromCookieWhenBodyMissing() throws Exception {
        TokenResponse tokenResponse = TokenResponse.builder()
                .accessToken("new-access")
                .refreshToken("new-refresh")
                .tokenType("Bearer")
                .build();

        when(authService.refreshToken("cookie-refresh")).thenReturn(tokenResponse);
        when(authService.getRefreshTokenExpirationSeconds()).thenReturn(1209600L);

        mockMvc.perform(post("/api/auth/refresh-token")
                        .cookie(new jakarta.servlet.http.Cookie("refresh_token", "cookie-refresh")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access"));
    }

    @Test
    void refreshToken_shouldReturn401WhenMissingToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    void logout_shouldRevokeTokenAndClearCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "refresh-logout"
                                }
                                """))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        verify(authService).logout("refresh-logout");
    }
}
