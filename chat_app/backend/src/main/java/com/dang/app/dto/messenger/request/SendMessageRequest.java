package com.dang.app.dto.messenger.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SendMessageRequest {

    @NotNull
    private UUID conversationId;

    private String content;

    @Valid
    private List<AttachmentRequest> attachments;
}