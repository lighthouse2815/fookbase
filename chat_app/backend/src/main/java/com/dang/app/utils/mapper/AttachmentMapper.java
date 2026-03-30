package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.AttachmentResponse;
import com.dang.app.entity.messenger.Attachment;
import org.springframework.stereotype.Component;

@Component
public class AttachmentMapper {

    public AttachmentResponse toAttachmentResponse(Attachment file) {
        if (file == null) {
            return null;
        }

        return AttachmentResponse.builder()
                .attachmentId(file.getId())
                .url(file.getFileUrl())
                .type(file.getFileType())
                .fileName(file.getFileName())
                .fileSize(file.getFileSize())
                .contentType(file.getContentType())
                .build();
    }

}
