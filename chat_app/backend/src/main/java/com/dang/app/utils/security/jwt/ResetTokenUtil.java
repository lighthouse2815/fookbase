package com.dang.app.utils.security.jwt;

import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class ResetTokenUtil {
    public static final String PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";
    public static final String PURPOSE_CHANGE_USERNAME = "CHANGE_USERNAME";
    public static final String PURPOSE_CHANGE_PHONENUMBER = "CHANGE_PHONENUMBER";

    @Value("${auth.reset-token.secret}")
    private String secret = "CHANGE_ME_USE_ENV_FOR_RESET_TOKEN_SECRET";

    @Value("${auth.reset-token.expiration-ms:180000}")
    private long expiration = 180000;

    private final RedisTemplate<String, String> redisTemplate;

    public ResetTokenUtil(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId) {
        return generateToken(userId, PURPOSE_RESET_PASSWORD);
    }

    public String generateToken(UUID userId, String purpose) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("purpose", purpose)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public UUID validateAndExtractUserId(String token) {
        return validateAndExtractUserId(token, PURPOSE_RESET_PASSWORD);
    }

    public UUID validateAndExtractUserId(String token, String expectedPurpose) {
        if (redisTemplate.hasKey(revokedKey(token))) {
            throw new BusinessException(ErrorCode.INVALID_RESET_TOKEN);
        }

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        if (!expectedPurpose.equals(claims.get("purpose"))) {
            throw new BusinessException(ErrorCode.INVALID_RESET_TOKEN);
        }

        return UUID.fromString(claims.getSubject());
    }



    public void revoke(String token) {
        long ttl = getRemainingTime(token);
        redisTemplate.opsForValue()
                .set(revokedKey(token), "1", ttl, TimeUnit.MILLISECONDS);
    }

    private long getRemainingTime(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Date expiration = claims.getExpiration();
        long remaining = expiration.getTime() - System.currentTimeMillis();

        return Math.max(remaining, 0);
    }

    private String revokedKey(String token) {
        return "revoked:reset:" + DigestUtils.sha256Hex(token);
    }


}

