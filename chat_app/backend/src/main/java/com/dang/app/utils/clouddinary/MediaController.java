package com.dang.app.utils.clouddinary;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final CloudinarySigningService cloudinarySigningService;

    @GetMapping("/cloudinary-signature")
    public ResponseEntity<Map<String, Object>> getCloudinaryUploadSignature(
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (!cloudinarySigningService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Cloudinary signing is not configured"));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(cloudinarySigningService.buildUploadSignature(userId));
    }
}
