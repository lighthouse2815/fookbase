package com.dangngulon.frontend.feature.zola.presentation.model;

import com.dangngulon.frontend.core.utils.enums.AttachmentType;

public class AttachmentUiModel {
    private String attachmentId;
    private String url;
    private AttachmentType type;
    private String fileName;
    private Long fileSize;
    private String contentType;

    public AttachmentUiModel() {
    }

    public AttachmentUiModel(
            String attachmentId,
            String url,
            AttachmentType type,
            String fileName,
            Long fileSize,
            String contentType
    ) {
        this.attachmentId = attachmentId;
        this.url = url;
        this.type = type;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
    }

    public String getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(String attachmentId) {
        this.attachmentId = attachmentId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public AttachmentType getType() {
        return type;
    }

    public void setType(AttachmentType type) {
        this.type = type;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
