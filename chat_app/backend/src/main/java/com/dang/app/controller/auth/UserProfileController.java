package com.dang.app.controller.auth;

import com.dang.app.dto.auth.request.CompleteProfileRequest;
import com.dang.app.dto.auth.request.UpdateProfileRequest;
import com.dang.app.dto.auth.request.UserProfileRequest;
import com.dang.app.dto.auth.request.UserProfileSearchRequest;
import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileOverviewResponse;
import com.dang.app.dto.auth.response.UserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSearchResponse;
import com.dang.app.service.auth.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/me/overview")
    public ResponseEntity<UserProfileOverviewResponse> getOverviewProfile(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                userProfileService.getOverviewProfile(userId)
        );
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid UserProfileRequest request
    ) {
        UUID myId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                userProfileService.getUserProfile(myId, request)
        );
    }

    @Operation(summary = "Get public profile by userId for external services")
    @ApiResponse(
            responseCode = "200",
            description = "Profile found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = PublicUserProfileResponse.class)
            )
    )
    @ApiResponse(responseCode = "400", description = "Invalid userId")
    @ApiResponse(responseCode = "404", description = "Profile not found")
    @GetMapping("/public")
    public ResponseEntity<PublicUserProfileResponse> getPublicProfileByUserId(
            @RequestParam @NotNull UUID userId
    ) {
        return ResponseEntity.ok(
                userProfileService.getPublicProfileByUserId(userId)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<UserProfileSearchResponse> searchUserProfileByPhoneNumber(
            @AuthenticationPrincipal Jwt jwt,
            @Valid UserProfileSearchRequest request
    ) {
        UUID myId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                userProfileService.searchUserProfileByPhoneNumber(myId, request)
        );
    }

    @PostMapping("/me/complete-profile")
    public void completeProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CompleteProfileRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        userProfileService.completeProfile(userId, request);
    }

    @PatchMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        userProfileService.updateProfile(userId, request);
    }
}
