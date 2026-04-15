package com.dang.app.controller.auth;

import com.dang.app.dto.admin.request.UpdateUserStatusRequest;
import com.dang.app.dto.admin.response.AdminUserSearchResponse;
import com.dang.app.dto.admin.response.AdminUserStatsResponse;
import com.dang.app.service.auth.AdminService;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users/search")
    public ResponseEntity<List<AdminUserSearchResponse>> searchUsers(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String keyword
    ) {
        requireAdmin(jwt);
        return ResponseEntity.ok(adminService.searchUsers(keyword));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<AdminUserSearchResponse> updateUserStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        requireAdmin(jwt);
        return ResponseEntity.ok(adminService.updateUserStatus(userId, request.getStatus()));
    }

    @GetMapping("/users/stats")
    public ResponseEntity<AdminUserStatsResponse> getUserStats(
            @AuthenticationPrincipal Jwt jwt
    ) {
        requireAdmin(jwt);
        return ResponseEntity.ok(adminService.getUserStats());
    }

    private static void requireAdmin(Jwt jwt) {
        Object roleClaim = jwt.getClaim("role");
        String role = roleClaim == null
                ? null
                : Objects.toString(roleClaim, null);

        if (role == null || !role.trim().toUpperCase(Locale.ROOT).equals("ADMIN")) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }
    }
}

