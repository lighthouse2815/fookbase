package com.dang.app.service.auth;

import com.dang.app.dto.auth.response.TokenResponse;
import com.dang.app.entity.auth.RefreshToken;
import com.dang.app.entity.auth.User;
import com.dang.app.repository.auth.TokenRepository;
import com.dang.app.utils.enums.Status;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.security.jwt.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private static final String TOKEN_TYPE = "Bearer";
    private static final String REASON_ROTATED = "ROTATED";
    private static final String REASON_LOGOUT = "LOGOUT";
    private static final String REASON_REUSE_DETECTED = "REUSE_DETECTED";

    private final JwtUtil jwtUtil;
    private final TokenRepository tokenRepository;
    private final UserGuard userGuard;

    @Transactional
    public TokenResponse issueTokenPair(User user) {
        UUID familyId = UUID.randomUUID();
        UUID tokenId = UUID.randomUUID();

        String refreshToken = jwtUtil.generateRefreshToken(user, tokenId, familyId);
        saveRefreshToken(user, tokenId, familyId, refreshToken, extractExpiry(refreshToken));

        String accessToken = jwtUtil.generateAccessToken(user);
        return buildTokenResponse(accessToken, refreshToken);
    }

    @Transactional
    public TokenResponse rotateRefreshToken(String rawRefreshToken) {
        Claims claims = jwtUtil.validateRefreshToken(rawRefreshToken);
        UUID tokenId = parseUuid(claims.getId(), ErrorCode.INVALID_REFRESH_TOKEN);
        UUID userId = parseUuid(claims.getSubject(), ErrorCode.INVALID_REFRESH_TOKEN);
        UUID familyId = parseUuid(claims.get("familyId", String.class), ErrorCode.INVALID_REFRESH_TOKEN);

        RefreshToken currentToken = tokenRepository.findByIdForUpdate(tokenId)
                .orElseThrow(() -> {
                    log.warn("Refresh token rotation failed: tokenId={} not found", tokenId);
                    return new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
                });

        validateStoredToken(rawRefreshToken, currentToken, userId, familyId);
        userGuard.requireNotDeleted(currentToken.getUser());
        if (currentToken.getUser().getStatus() == Status.BANNED) {
            throw new BusinessException(ErrorCode.USER_BANNED);
        }

        UUID newTokenId = UUID.randomUUID();
        String nextRefreshToken = jwtUtil.generateRefreshToken(currentToken.getUser(), newTokenId, familyId);

        currentToken.setRevokedAt(nowUtc());
        currentToken.setRevokedReason(REASON_ROTATED);
        currentToken.setReplacedByTokenId(newTokenId);
        tokenRepository.save(currentToken);

        saveRefreshToken(
                currentToken.getUser(),
                newTokenId,
                familyId,
                nextRefreshToken,
                extractExpiry(nextRefreshToken)
        );

        String nextAccessToken = jwtUtil.generateAccessToken(currentToken.getUser());
        return buildTokenResponse(nextAccessToken, nextRefreshToken);
    }

    @Transactional
    public void revokeByRefreshToken(String rawRefreshToken) {
        Claims claims = jwtUtil.extractRefreshClaimsAllowExpired(rawRefreshToken);
        UUID tokenId = parseUuid(claims.getId(), ErrorCode.INVALID_REFRESH_TOKEN);

        RefreshToken storedToken = tokenRepository.findByIdForUpdate(tokenId)
                .orElseThrow(() -> {
                    log.warn("Logout failed: refresh token tokenId={} not found", tokenId);
                    return new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
                });

        if (!storedToken.getTokenHash().equals(hashToken(rawRefreshToken))) {
            log.warn("Logout failed: refresh token hash mismatch tokenId={}", tokenId);
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (storedToken.getRevokedAt() == null) {
            storedToken.setRevokedAt(nowUtc());
            storedToken.setRevokedReason(REASON_LOGOUT);
            tokenRepository.save(storedToken);
        }
    }

    public long getRefreshTokenExpirationSeconds() {
        return Math.max(jwtUtil.getRefreshTokenExpirationMs() / 1000, 1);
    }

    private void validateStoredToken(
            String rawRefreshToken,
            RefreshToken storedToken,
            UUID userId,
            UUID familyId
    ) {
        if (!storedToken.getUser().getId().equals(userId)) {
            log.warn("Refresh token rotation failed: user mismatch tokenId={}", storedToken.getId());
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (!storedToken.getFamilyId().equals(familyId)) {
            log.warn("Refresh token rotation failed: family mismatch tokenId={}", storedToken.getId());
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (!storedToken.getTokenHash().equals(hashToken(rawRefreshToken))) {
            log.warn("Refresh token rotation failed: hash mismatch tokenId={}", storedToken.getId());
            revokeFamily(storedToken.getFamilyId(), REASON_REUSE_DETECTED);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED);
        }

        if (storedToken.getRevokedAt() != null) {
            log.warn("Refresh token reuse detected: tokenId={}", storedToken.getId());
            revokeFamily(storedToken.getFamilyId(), REASON_REUSE_DETECTED);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED);
        }

        if (storedToken.getExpiresAt().isBefore(nowUtc())) {
            log.warn("Refresh token rotation failed: tokenId={} expired at {}", storedToken.getId(), storedToken.getExpiresAt());
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
    }

    private void saveRefreshToken(
            User user,
            UUID tokenId,
            UUID familyId,
            String rawRefreshToken,
            LocalDateTime expiresAt
    ) {
        RefreshToken refreshToken = RefreshToken.builder()
                .id(tokenId)
                .user(user)
                .familyId(familyId)
                .tokenHash(hashToken(rawRefreshToken))
                .issuedAt(nowUtc())
                .expiresAt(expiresAt)
                .build();
        tokenRepository.save(refreshToken);
    }

    private void revokeFamily(UUID familyId, String reason) {
        tokenRepository.revokeActiveByFamilyId(familyId, nowUtc(), reason);
    }

    private TokenResponse buildTokenResponse(String accessToken, String refreshToken) {
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType(TOKEN_TYPE)
                .build();
    }

    private LocalDateTime extractExpiry(String refreshToken) {
        Claims claims = jwtUtil.extractClaims(refreshToken);
        return toUtcDateTime(claims.getExpiration());
    }

    private UUID parseUuid(String rawValue, ErrorCode errorCode) {
        try {
            return UUID.fromString(rawValue);
        } catch (Exception ex) {
            throw new BusinessException(errorCode);
        }
    }

    private String hashToken(String rawToken) {
        return DigestUtils.sha256Hex(rawToken);
    }

    private LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    private LocalDateTime toUtcDateTime(Date date) {
        return LocalDateTime.ofInstant(date.toInstant(), ZoneOffset.UTC);
    }
}
