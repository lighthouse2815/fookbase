package com.dangngulon.frontend.feature.zola.data.remote.dto.request;

import com.dangngulon.frontend.core.utils.enums.AttachmentType;

public class AttachmentRequest {
    private String fileUrl;
    private String fileName;
    private AttachmentType fileType;
    private Long fileSize;
    private String contentType;

    public AttachmentRequest() {
    }

    public AttachmentRequest(String fileUrl, String fileName, AttachmentType fileType, 
                           Long fileSize, String contentType) {
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.contentType = contentType;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public AttachmentType getFileType() {
        return fileType;
    }

    public void setFileType(AttachmentType fileType) {
        this.fileType = fileType;
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
