package com.dang.app.dto.messenger.request;

import com.dang.app.entity.messenger.Attachment;
import com.dang.app.utils.enums.AttachmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class AttachmentRequest {

    @NotBlank
    private String fileUrl;

    @NotBlank
    private String fileName;

    @NotNull
    private AttachmentType fileType;

    @NotNull
    @Positive
    private Long fileSize;

    @NotBlank
    private String contentType;
}

