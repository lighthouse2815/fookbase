package com.dangngulon.frontend.feature.zola.data.repository;

import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.feature.zola.data.remote.api.UploadApi;
import com.dangngulon.frontend.feature.zola.domain.repository.IUploadRepository;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;

@Singleton
public class UploadRepository implements IUploadRepository {
    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";
    private static final String CLOUDINARY_UPLOAD_URL_TEMPLATE = "https://api.cloudinary.com/v1_1/%s/auto/upload";

    private final UploadApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public UploadRepository(UploadApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<String>> upload(String fileName, String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError("File content is empty"))
            );
        }

        String safeFileName = (fileName == null || fileName.trim().isEmpty())
                ? "upload_" + System.currentTimeMillis()
                : fileName.trim();

        String safeContentType = (contentType == null || contentType.trim().isEmpty())
                ? DEFAULT_CONTENT_TYPE
                : contentType.trim();

        return requestCloudinarySignature()
                .thenCompose(signatureResult -> {
                    if (signatureResult instanceof AppResult.Error<CloudinarySignature> error) {
                        return CompletableFuture.completedFuture(AppResult.error(error.getError()));
                    }

                    if (!(signatureResult instanceof AppResult.Success<CloudinarySignature> success)
                            || success.getData() == null) {
                        return CompletableFuture.completedFuture(
                                AppResult.error(new AppError("Cannot prepare upload signature"))
                        );
                    }

                    return uploadToCloudinary(success.getData(), safeFileName, safeContentType, bytes);
                });
    }

    private CompletableFuture<AppResult<CloudinarySignature>> requestCloudinarySignature() {
        Call<Map<String, Object>> call = api.getCloudinarySignature();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Error<Map<String, Object>> error) {
                        return AppResult.error(error.getError());
                    }

                    if (!(result instanceof AppResult.Success<Map<String, Object>> success)) {
                        return AppResult.error(new AppError("Failed to load upload signature"));
                    }

                    CloudinarySignature signature = parseSignaturePayload(success.getData());
                    if (signature == null) {
                        return AppResult.error(new AppError("Invalid upload signature response"));
                    }

                    return AppResult.success(signature);
                });
    }

    private CompletableFuture<AppResult<String>> uploadToCloudinary(
            CloudinarySignature signature,
            String fileName,
            String contentType,
            byte[] bytes
    ) {
        MediaType mediaType = MediaType.parse(contentType);
        if (mediaType == null) {
            mediaType = MediaType.parse(DEFAULT_CONTENT_TYPE);
        }
        if (mediaType == null) {
            return CompletableFuture.completedFuture(AppResult.error(new AppError("Invalid upload content type")));
        }

        RequestBody fileRequestBody = RequestBody.create(mediaType, bytes);
        MultipartBody.Part filePart = MultipartBody.Part.createFormData("file", fileName, fileRequestBody);

        Map<String, RequestBody> fields = new LinkedHashMap<>();
        fields.put("api_key", createTextPart(signature.apiKey));
        fields.put("timestamp", createTextPart(String.valueOf(signature.timestamp)));
        fields.put("signature", createTextPart(signature.signature));
        fields.put("folder", createTextPart(signature.folder));
        fields.put("public_id", createTextPart(signature.publicId));
        fields.put("overwrite", createTextPart(String.valueOf(signature.overwrite)));
        if (signature.uploadPreset != null && !signature.uploadPreset.isBlank()) {
            fields.put("upload_preset", createTextPart(signature.uploadPreset));
        }

        String uploadUrl = String.format(
                Locale.ROOT,
                CLOUDINARY_UPLOAD_URL_TEMPLATE,
                signature.cloudName
        );

        Call<Map<String, Object>> call = api.uploadToCloudinary(uploadUrl, fields, filePart);
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Error<Map<String, Object>> error) {
                        return AppResult.error(error.getError());
                    }

                    if (!(result instanceof AppResult.Success<Map<String, Object>> success)) {
                        return AppResult.error(new AppError("Cloudinary upload failed"));
                    }

                    String uploadedUrl = findUploadedUrl(success.getData());
                    if (uploadedUrl == null) {
                        return AppResult.error(new AppError("Upload succeeded but URL was not returned"));
                    }

                    return AppResult.success(uploadedUrl);
                });
    }

    private RequestBody createTextPart(String value) {
        return RequestBody.create(MultipartBody.FORM, value);
    }

    private CloudinarySignature parseSignaturePayload(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }

        Map<?, ?> dataPayload = payload;
        Object dataNode = payload.get("data");
        if (dataNode instanceof Map<?, ?> nested && !nested.isEmpty()) {
            dataPayload = nested;
        }

        String cloudName = firstNonBlank(
                findStringValue(dataPayload, "cloudName", "cloud_name"),
                findStringValue(payload, "cloudName", "cloud_name")
        );
        String apiKey = firstNonBlank(
                findStringValue(dataPayload, "apiKey", "api_key"),
                findStringValue(payload, "apiKey", "api_key")
        );
        String uploadPreset = firstNonBlank(
                findStringValue(dataPayload, "uploadPreset", "upload_preset"),
                findStringValue(payload, "uploadPreset", "upload_preset")
        );
        String folder = firstNonBlank(
                findStringValue(dataPayload, "folder"),
                findStringValue(payload, "folder")
        );
        String publicId = firstNonBlank(
                findStringValue(dataPayload, "publicId", "public_id"),
                findStringValue(payload, "publicId", "public_id")
        );
        String signature = firstNonBlank(
                findStringValue(dataPayload, "signature"),
                findStringValue(payload, "signature")
        );

        Long timestamp = firstNonNull(
                findLongValue(dataPayload, "timestamp"),
                findLongValue(payload, "timestamp")
        );
        Boolean overwriteValue = firstNonNull(
                findBooleanValue(dataPayload, "overwrite"),
                findBooleanValue(payload, "overwrite")
        );
        boolean overwrite = overwriteValue != null && overwriteValue;

        if (isBlank(cloudName)
                || isBlank(apiKey)
                || isBlank(folder)
                || isBlank(publicId)
                || isBlank(signature)
                || timestamp == null
                || timestamp <= 0L) {
            return null;
        }

        return new CloudinarySignature(
                cloudName,
                apiKey,
                uploadPreset,
                folder,
                publicId,
                overwrite,
                timestamp,
                signature
        );
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        if (values == null || values.length == 0) {
            return null;
        }

        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String firstNonBlank(String first, String second) {
        if (!isBlank(first)) {
            return first.trim();
        }
        if (!isBlank(second)) {
            return second.trim();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String findStringValue(Map<?, ?> payload, String... keys) {
        if (payload == null || payload.isEmpty() || keys == null) {
            return null;
        }

        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof String text && !text.trim().isEmpty()) {
                return text.trim();
            }
        }

        return null;
    }

    private Long findLongValue(Map<?, ?> payload, String... keys) {
        if (payload == null || payload.isEmpty() || keys == null) {
            return null;
        }

        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof Number number) {
                return number.longValue();
            }
            if (value instanceof String text) {
                try {
                    return Long.parseLong(text.trim());
                } catch (NumberFormatException ignored) {
                    // Ignore and continue checking fallbacks.
                }
            }
        }

        return null;
    }

    private Boolean findBooleanValue(Map<?, ?> payload, String... keys) {
        if (payload == null || payload.isEmpty() || keys == null) {
            return null;
        }

        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof Boolean boolValue) {
                return boolValue;
            }
            if (value instanceof String text) {
                String normalized = text.trim().toLowerCase(Locale.ROOT);
                if ("true".equals(normalized)) {
                    return true;
                }
                if ("false".equals(normalized)) {
                    return false;
                }
            }
        }

        return null;
    }

    private String findUploadedUrl(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }

        String[] preferredKeys = {"url", "imageUrl", "secure_url", "secureUrl", "fileUrl", "filePath", "path"};
        for (String key : preferredKeys) {
            Object value = payload.get(key);
            String normalizedUrl = normalizeUploadedUrl(value);
            if (normalizedUrl != null) {
                return normalizedUrl;
            }
        }

        Object nestedData = payload.get("data");
        if (nestedData instanceof Map<?, ?> dataMap) {
            for (String key : preferredKeys) {
                Object value = dataMap.get(key);
                String normalizedUrl = normalizeUploadedUrl(value);
                if (normalizedUrl != null) {
                    return normalizedUrl;
                }
            }
        }

        for (Object value : payload.values()) {
            String normalizedUrl = normalizeUploadedUrl(value);
            if (normalizedUrl != null) {
                return normalizedUrl;
            }

            if (value instanceof Map<?, ?> nested) {
                String nestedUrl = findUploadedUrlFromUnknownMap(nested);
                if (nestedUrl != null) {
                    return nestedUrl;
                }
            }
        }

        return null;
    }

    private String findUploadedUrlFromUnknownMap(Map<?, ?> payload) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }

        for (Object value : payload.values()) {
            String normalizedUrl = normalizeUploadedUrl(value);
            if (normalizedUrl != null) {
                return normalizedUrl;
            }

            if (value instanceof Map<?, ?> nested) {
                String nestedUrl = findUploadedUrlFromUnknownMap(nested);
                if (nestedUrl != null) {
                    return nestedUrl;
                }
            }
        }

        return null;
    }

    private String normalizeUploadedUrl(Object value) {
        if (!(value instanceof String rawValue)) {
            return null;
        }

        String trimmed = rawValue.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (isHttpUrl(trimmed)) {
            return trimmed;
        }

        if (trimmed.startsWith("//")) {
            return "https:" + trimmed;
        }

        if (trimmed.startsWith("/") || trimmed.toLowerCase(Locale.ROOT).startsWith("uploads/")) {
            String relativePath = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
            return resolveAgainstBaseUrl(relativePath);
        }

        return null;
    }

    private String resolveAgainstBaseUrl(String relativePath) {
        try {
            URI baseUri = URI.create(BuildConfig.BASE_URL);
            URI resolvedUri = baseUri.resolve(relativePath);
            return resolvedUri.toString();
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isHttpUrl(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("https://") || normalized.startsWith("http://");
    }

    private static final class CloudinarySignature {
        private final String cloudName;
        private final String apiKey;
        private final String uploadPreset;
        private final String folder;
        private final String publicId;
        private final boolean overwrite;
        private final long timestamp;
        private final String signature;

        private CloudinarySignature(
                String cloudName,
                String apiKey,
                String uploadPreset,
                String folder,
                String publicId,
                boolean overwrite,
                long timestamp,
                String signature
        ) {
            this.cloudName = cloudName;
            this.apiKey = apiKey;
            this.uploadPreset = uploadPreset;
            this.folder = folder;
            this.publicId = publicId;
            this.overwrite = overwrite;
            this.timestamp = timestamp;
            this.signature = signature;
        }
    }
}
