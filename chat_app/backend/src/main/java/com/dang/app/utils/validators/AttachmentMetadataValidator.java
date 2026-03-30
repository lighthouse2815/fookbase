package com.dang.app.utils.validators;

import com.dang.app.utils.enums.AttachmentType;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Set;

@Component
public class AttachmentMetadataValidator {

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;   // 5MB
    private static final long MAX_VIDEO_SIZE = 50L * 1024 * 1024;  // 50MB
    private static final long MAX_FILE_SIZE  = 20L * 1024 * 1024;  // 20MB

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "video/mp4",
            "application/pdf"
    );

    public void validate(
            String fileUrl,
            String fileName,
            Long fileSize,
            AttachmentType type,
            String contentType
    ) {

        validateUrl(fileUrl);
        validateFileName(fileName);
        validateFileSize(fileSize, type);
        validateMime(contentType);
        validateTypeMatch(contentType, type);
    }

    private void validateUrl(String fileUrl) {

        if (!StringUtils.hasText(fileUrl)) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }

        try {
            URI uri = new URI(fileUrl);

            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                throw new BusinessException(ErrorCode.INVALID_FILE_URL);
            }

        } catch (URISyntaxException e) {
            throw new BusinessException(ErrorCode.INVALID_FILE_URL);
        }
    }

    private void validateFileName(String fileName) {

        if (!StringUtils.hasText(fileName)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_NAME);
        }

        String cleanName = StringUtils.cleanPath(fileName);

        if (cleanName.contains("..")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_NAME);
        }
    }

    private void validateFileSize(Long size, AttachmentType type) {

        if (size == null || size <= 0) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }

        switch (type) {
            case IMAGE -> {
                if (size > MAX_IMAGE_SIZE)
                    throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
            }
            case VIDEO -> {
                if (size > MAX_VIDEO_SIZE)
                    throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
            }
            case FILE -> {
                if (size > MAX_FILE_SIZE)
                    throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
            }
        }
    }

    private void validateMime(String contentType) {

        if (!StringUtils.hasText(contentType)
                || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
    }

    private void validateTypeMatch(String mime, AttachmentType type) {

        switch (type) {
            case IMAGE -> {
                if (!mime.startsWith("image/"))
                    throw new BusinessException(ErrorCode.FILE_TYPE_MISMATCH);
            }
            case VIDEO -> {
                if (!mime.startsWith("video/"))
                    throw new BusinessException(ErrorCode.FILE_TYPE_MISMATCH);
            }
            case FILE -> {
                if (mime.startsWith("image/") || mime.startsWith("video/"))
                    throw new BusinessException(ErrorCode.FILE_TYPE_MISMATCH);
            }
        }
    }
}
