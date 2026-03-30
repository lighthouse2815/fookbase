package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.request.AttachmentRequest;
import com.dang.app.dto.messenger.response.AttachmentResponse;
import com.dang.app.entity.messenger.Attachment;
import com.dang.app.entity.messenger.Message;
import com.dang.app.repository.messenger.AttachmentRepository;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.mapper.AttachmentMapper;
import com.dang.app.utils.validators.AttachmentMetadataValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    private final AttachmentMapper attachmentMapper;

    private final AttachmentMetadataValidator validator;

    public List<AttachmentResponse> saveAttachments(
            List<AttachmentRequest> files,
            Message message
    ) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        if (files.size() > 10) {
            throw new BusinessException(ErrorCode.TOO_MANY_ATTACHMENTS);
        }

        List<Attachment> attachments = files.stream()
                .map(file -> {

                    validator.validate(
                            file.getFileUrl(),
                            file.getFileName(),
                            file.getFileSize(),
                            file.getFileType(),
                            file.getContentType()
                    );

                    return Attachment.builder()
                            .message(message)
                            .fileUrl(file.getFileUrl())
                            .fileName(file.getFileName())
                            .fileType(file.getFileType())
                            .fileSize(file.getFileSize())
                            .contentType(file.getContentType())
                            .build();
                })
                .toList();

        return attachmentRepository.saveAll(attachments)
                .stream()
                .map(attachmentMapper::toAttachmentResponse)
                .toList();
    }


}

