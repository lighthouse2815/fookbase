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

