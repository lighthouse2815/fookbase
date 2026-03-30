package com.dang.app.dto.messenger.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class MessageCursorPageResponse {

    private List<MessageResponse> messages;
    private MessageCursor nextCursor;
}
