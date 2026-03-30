package com.dang.app.dto.messenger.response;

import com.dang.app.utils.enums.AttachmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AttachmentResponse {

    private UUID attachmentId;
    private String url;
    private AttachmentType type;
    private String fileName;
    private Long fileSize;
    private String contentType;
}

