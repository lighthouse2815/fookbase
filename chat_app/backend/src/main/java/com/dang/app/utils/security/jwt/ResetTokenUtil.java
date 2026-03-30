package com.dang.app.utils.security.jwt;

import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.AllArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@AllArgsConstructor
public class ResetTokenUtil {

    private final String secret = "reset_password_secret_key_256bit_minimum!!!";
    private final long expiration = 1000 * 60 * 3;

    private final RedisTemplate<String, String> redisTemplate;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("purpose", "RESET_PASSWORD")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public UUID validateAndExtractUserId(String token) {
        if (redisTemplate.hasKey(revokedKey(token))) {
            throw new BusinessException(ErrorCode.INVALID_RESET_TOKEN);
        }

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        if (!"RESET_PASSWORD".equals(claims.get("purpose"))) {
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

