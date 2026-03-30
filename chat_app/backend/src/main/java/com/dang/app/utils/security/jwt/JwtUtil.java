package com.dang.app.utils.security.jwt;

import com.dang.app.entity.auth.User;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.signer-key}")
    private String secret;

    @Value("${jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:2592000000}")
    private long refreshTokenExpirationMs;

    @Value("${jwt.issuer:chat-app}")
    private String issuer;

    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String CLAIM_FAMILY_ID = "familyId";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        return generateAccessToken(user);
    }

    public String generateAccessToken(User user) {
        JwtBuilder builder = Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim(CLAIM_TOKEN_TYPE, TYPE_ACCESS)
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256);

        if (user.getUsername() != null) {
            builder.claim("username", user.getUsername());
        }

        return builder.compact();
    }

    public String generateRefreshToken(
            User user,
            UUID tokenId,
            UUID familyId
    ) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .setId(tokenId.toString())
                .claim(CLAIM_TOKEN_TYPE, TYPE_REFRESH)
                .claim(CLAIM_FAMILY_ID, familyId.toString())
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Claims validateRefreshToken(String token) {
        try {
            Claims claims = extractClaims(token);
            requireRefreshToken(claims);
            return claims;
        } catch (ExpiredJwtException ex) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }

    public Claims extractRefreshClaimsAllowExpired(String token) {
        try {
            Claims claims = extractClaims(token);
            requireRefreshToken(claims);
            return claims;
        } catch (ExpiredJwtException ex) {
            Claims claims = ex.getClaims();
            if (claims == null) {
                throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
            }
            requireRefreshToken(claims);
            return claims;
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }

    public boolean validateToken(String token, String userId) {
        final String tokenUserId = extractClaims(token).getSubject();
        return tokenUserId.equals(userId) && !isTokenExpired(token);
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    private void requireRefreshToken(Claims claims) {
        String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        if (!TYPE_REFRESH.equals(tokenType)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (!issuer.equals(claims.getIssuer())) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String familyId = claims.get(CLAIM_FAMILY_ID, String.class);
        if (familyId == null || familyId.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }
}
