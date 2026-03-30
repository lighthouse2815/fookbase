package com.dang.app.controller.auth;

import com.dang.app.dto.auth.response.UserBasicResponse;
import com.dang.app.service.auth.UserService;
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

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getUserById_shouldReturn200_whenUserExists() throws Exception {
        UUID userId = UUID.randomUUID();

        when(userService.getBasicUserById(userId)).thenReturn(
                UserBasicResponse.builder()
                        .id(userId)
                        .username("alice")
                        .build()
        );

        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void getUserById_shouldReturn404_whenUserNotFound() throws Exception {
        UUID userId = UUID.randomUUID();

        when(userService.getBasicUserById(userId))
                .thenThrow(new BusinessException(ErrorCode.USER_NOT_FOUND));

        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.USER_NOT_FOUND.name()));
    }

    @Test
    void getUserById_shouldReturn400_whenIdIsInvalidUuid() throws Exception {
        mockMvc.perform(get("/api/users/{id}", "invalid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }
}
