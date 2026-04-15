package com.dang.app.controller.auth;

import com.dang.app.dto.auth.request.*;
import com.dang.app.dto.auth.response.*;
import com.dang.app.service.auth.AuthService;
import com.dang.app.utils.enums.OTPMailType;
import com.dang.app.utils.enums.OTPType;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${auth.refresh-cookie.name:refresh_token}")
    private String refreshCookieName;

    @Value("${auth.refresh-cookie.path:/}")
    private String refreshCookiePath;

    @Value("${auth.refresh-cookie.secure:true}")
    private boolean refreshCookieSecure;

    @Value("${auth.refresh-cookie.same-site:Strict}")
    private String refreshCookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);

        if (response.getRefreshToken() == null || response.getRefreshToken().isBlank()) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        buildRefreshCookie(response.getRefreshToken(), authService.getRefreshTokenExpirationSeconds()).toString()
                )
                .body(response);
    }

    @Operation(summary = "Rotate refresh token and issue new access token")
    @ApiResponse(
            responseCode = "200",
            description = "Token refreshed",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TokenResponse.class)
            )
    )
    @ApiResponse(responseCode = "401", description = "Refresh token invalid/expired/reused")
    @PostMapping("/refresh-token")
    public ResponseEntity<TokenResponse> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String refreshToken = resolveRefreshToken(request == null ? null : request.getRefreshToken(), httpServletRequest);
        TokenResponse tokenResponse = authService.refreshToken(refreshToken);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        buildRefreshCookie(tokenResponse.getRefreshToken(), authService.getRefreshTokenExpirationSeconds()).toString()
                )
                .body(tokenResponse);
    }

    @Operation(summary = "Logout and revoke refresh token")
    @ApiResponse(responseCode = "204", description = "Logged out")
    @ApiResponse(responseCode = "401", description = "Refresh token invalid")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) LogoutRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String refreshToken = resolveRefreshToken(request == null ? null : request.getRefreshToken(), httpServletRequest);
        authService.logout(refreshToken);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @PostMapping("/otp/send/verify-email")
    public ResponseEntity<OtpVerifyResponse> sendVerifyEmailOtpWhenNotLogin(@Valid @RequestBody OTPRequest request) {
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenNotLogin(
                        request,
                        OTPType.EMAIL_VERIFY,
                        OTPMailType.EMAIL_VERIFY
                )
        );
    }

    @PostMapping("/me/otp/send/verify-email")
    public ResponseEntity<OtpVerifyResponse> sendVerifyEmailOtpWhenLogin( @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenLogin(
                        userId,
                        OTPType.EMAIL_VERIFY,
                        OTPMailType.EMAIL_VERIFY
                )
        );
    }

    @PostMapping("/me/otp/send/change-username")
    public ResponseEntity<OtpVerifyResponse> sendChangeUsernameOtpWhenLogin(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenLogin(
                        userId,
                        OTPType.CHANGE_USERNAME_VERIFY,
                        OTPMailType.CHANGE_USERNAME_VERIFY
                )
        );
    }

    @PostMapping("/me/otp/send/change-phone-number")
    public ResponseEntity<OtpVerifyResponse> sendChangePhoneNumberOtpWhenLogin(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenLogin(
                        userId,
                        OTPType.CHANGE_PHONENUMBER_VERIFY,
                        OTPMailType.CHANGE_PHONENUMBER_VERIFY
                )
        );
    }

    @PostMapping("/otp/send/reset-password")
    public ResponseEntity<OtpVerifyResponse> sendResetPasswordOtpWhenNotLogin(@Valid @RequestBody OTPRequest request) {
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenNotLogin(
                        request,
                        OTPType.PASSWORD_RESET,
                        OTPMailType.PASSWORD_RESET
                )
        );
    }

    @PostMapping("/me/otp/send/reset-password")
    public ResponseEntity<OtpVerifyResponse> sendResetPasswordOtpWhenLogin(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                authService.createAndSendOTPWhenLogin(
                        userId,
                        OTPType.PASSWORD_RESET,
                        OTPMailType.PASSWORD_RESET
                )
        );
    }

    @PostMapping("/otp/verify/email")
    public ResponseEntity<OtpVerifyResponse> verifyOtpEmailWhenNotLogin(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(
                authService.verifyOTPWhenNotLogin(
                        request,
                        OTPType.EMAIL_VERIFY
                )
        );
    }

    @PostMapping("/me/otp/verify/email")
    public ResponseEntity<OtpVerifyResponse> verifyOtpEmailWhenLogin(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
            authService.verifyOTPWhenLogin(
                    userId,
                    OTPType.EMAIL_VERIFY,
                    request
            )
        );
    }

    @PostMapping("/me/otp/verify/change-username")
    public ResponseEntity<OtpVerifyResponse> verifyOtpChangeUsernameWhenLogin(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
            authService.verifyOTPWhenLogin(
                    userId,
                    OTPType.CHANGE_USERNAME_VERIFY,
                    request
            )
        );
    }

    @PostMapping("/me/otp/verify/change-phone-number")
    public ResponseEntity<OtpVerifyResponse> verifyOtpChangePhoneNumberWhenLogin(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
            authService.verifyOTPWhenLogin(
                    userId,
                    OTPType.CHANGE_PHONENUMBER_VERIFY,
                    request
            )
        );
    }

    @PostMapping("/otp/verify/password")
    public ResponseEntity<OtpVerifyResponse> verifyOtpResetPasswordWhenNotLogin(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(
                authService.verifyOTPWhenNotLogin(
                        request,
                        OTPType.PASSWORD_RESET
                )
        );
    }

    @PostMapping("/me/otp/verify/password")
    public ResponseEntity<OtpVerifyResponse> verifyOtpResetPasswordWhenLogin(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
            authService.verifyOTPWhenLogin(
                    userId,
                    OTPType.PASSWORD_RESET,
                    request
            )
        );
    }

    @PostMapping("/google")
    public GoogleAuthResponse authWithGoogle(@Valid @RequestBody GoogleTokenRequest request) {
        return authService.registerWithGoogle(request);
    }

    @Operation(summary = "Reset password")
    @ApiResponse(
            responseCode = "200",
            description = "Reset thành công",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MessageResponse.class)
            )
    )
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @RequestHeader("X-Reset-Token") String resetToken,
            @RequestBody @Valid ResetPasswordRequest request
    ) {
        return ResponseEntity.ok(
                authService.resetPassword(resetToken, request)
        );
    }

    private String resolveRefreshToken(
            String bodyToken,
            HttpServletRequest request
    ) {
        if (bodyToken != null && !bodyToken.isBlank()) {
            return bodyToken.trim();
        }

        if (request.getCookies() == null) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        for (Cookie cookie : request.getCookies()) {
            if (refreshCookieName.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }

        throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    private ResponseCookie buildRefreshCookie(String refreshToken, long maxAgeSeconds) {
        return ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .sameSite(refreshCookieSameSite)
                .maxAge(maxAgeSeconds)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .sameSite(refreshCookieSameSite)
                .maxAge(0)
                .build();
    }
}

