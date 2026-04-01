package com.dang.app.controller.auth;

import com.dang.app.dto.auth.response.UserBasicResponse;
import com.dang.app.service.auth.UserService;
import com.dang.app.dto.messenger.response.FriendSuggestionResponse;
import com.dang.app.service.messenger.FriendshipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FriendshipService friendshipService;

    @Operation(summary = "Get public basic user by id")
    @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = UserBasicResponse.class)
            )
    )
    @ApiResponse(responseCode = "400", description = "Invalid user id")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping("/{id}")
    public ResponseEntity<UserBasicResponse> getUserById(
            @PathVariable @NotNull UUID id
    ) {
        return ResponseEntity.ok(
                userService.getBasicUserById(id)
        );
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<FriendSuggestionResponse>> getFriendSuggestions(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        return ResponseEntity.ok(
                friendshipService.getFriendSuggestions(userId, pageable)
        );
    }

}

