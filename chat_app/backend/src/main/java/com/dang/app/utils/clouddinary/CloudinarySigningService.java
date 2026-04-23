package com.dang.app.utils.clouddinary;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class CloudinarySigningService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.upload-preset:}")
    private String uploadPreset;

    @Value("${cloudinary.upload-folder:chat_images}")
    private String uploadFolder;

    public boolean isConfigured() {
        return isNotBlank(cloudName)
                && isNotBlank(apiKey)
                && isNotBlank(apiSecret);
    }

    public Map<String, Object> buildUploadSignature(UUID userId) {
        String folder = buildUploadFolder(userId);
        String publicId = Instant.now().toEpochMilli() + "_" + UUID.randomUUID().toString().replace("-", "");
        boolean overwrite = false;
        long timestamp = Instant.now().getEpochSecond();

        SortedMap<String, String> parametersToSign = new TreeMap<>();
        parametersToSign.put("folder", folder);
        parametersToSign.put("overwrite", String.valueOf(overwrite));
        parametersToSign.put("public_id", publicId);
        parametersToSign.put("timestamp", String.valueOf(timestamp));
        if (isNotBlank(uploadPreset)) {
            parametersToSign.put("upload_preset", uploadPreset);
        }

        String signature = generateSignature(parametersToSign);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("cloudName", cloudName);
        payload.put("apiKey", apiKey);
        payload.put("uploadPreset", uploadPreset);
        payload.put("folder", folder);
        payload.put("publicId", publicId);
        payload.put("overwrite", overwrite);
        payload.put("timestamp", timestamp);
        payload.put("signature", signature);
        return payload;
    }

    private String buildUploadFolder(UUID userId) {
        String normalizedRoot = isNotBlank(uploadFolder)
                ? uploadFolder.trim().replaceAll("^/+", "").replaceAll("/+$", "")
                : "chat_images";
        return normalizedRoot + "/" + userId;
    }

    private String generateSignature(SortedMap<String, String> parametersToSign) {
        String serializedParams = String.join(
                "&",
                parametersToSign.entrySet().stream()
                        .map(entry -> entry.getKey() + "=" + entry.getValue())
                        .toList()
        );

        String toHash = serializedParams + Objects.requireNonNullElse(apiSecret, "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(toHash.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexBuilder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                hexBuilder.append(String.format("%02x", value));
            }
            return hexBuilder.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot generate Cloudinary signature", exception);
        }
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
