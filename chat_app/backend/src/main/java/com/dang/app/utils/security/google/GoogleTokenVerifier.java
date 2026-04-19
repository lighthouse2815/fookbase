package com.dang.app.utils.security.google;

import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    @Value("${google.oauth.client-id}")
    private String clientId;

    private static final String GOOGLE_ISSUER_1 = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_2 = "accounts.google.com";
    private static final String GOOGLE_JWK_URL =
            "https://www.googleapis.com/oauth2/v3/certs";

    public JWTClaimsSet verify(String idToken) {
        try {
            // 1. Parse token
            SignedJWT signedJWT = SignedJWT.parse(idToken);

            // 2. Load Google public keys
            JWKSet jwkSet = JWKSet.load(new URL(GOOGLE_JWK_URL));
            JWK jwk = jwkSet.getKeyByKeyId(signedJWT.getHeader().getKeyID());

            if (jwk == null) {
                throw new BusinessException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }

            // 3. Verify signature
            RSAKey rsaKey = (RSAKey) jwk;
            RSAPublicKey publicKey = rsaKey.toRSAPublicKey();
            JWSVerifier verifier = new RSASSAVerifier(publicKey);

            if (!signedJWT.verify(verifier)) {
                throw new BusinessException(ErrorCode.INVALID_GOOGLE_SIGNATURE);
            }

            // 4. Get claims (payload)
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // 5. Verify issuer
            String issuer = claims.getIssuer();
            if (!GOOGLE_ISSUER_1.equals(issuer) && !GOOGLE_ISSUER_2.equals(issuer)) {
                throw new BusinessException(ErrorCode.INVALID_GOOGLE_ISSUER);
            }

            // 6. Verify audience (client id)
            List<String> audiences = claims.getAudience();
            Set<String> allowedClientIds = resolveAllowedClientIds();
            boolean validAudience = audiences != null
                    && audiences.stream().anyMatch(allowedClientIds::contains);
            if (!validAudience) {
                log.warn("Invalid Google audience. tokenAudiences={}, allowedClientIds={}", audiences, allowedClientIds);
                throw new BusinessException(ErrorCode.INVALID_GOOGLE_AUDIENCE);
            }

            // 7. Verify expiration
            Date expiration = claims.getExpirationTime();
            if (expiration == null || expiration.before(Date.from(Instant.now()))) {
                throw new BusinessException(ErrorCode.GOOGLE_TOKEN_EXPIRED);
            }

            return claims;

        } catch (ParseException | JOSEException | java.io.IOException e) {
            throw new BusinessException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    private Set<String> resolveAllowedClientIds() {
        if (clientId == null || clientId.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(clientId.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toSet());
    }
}
