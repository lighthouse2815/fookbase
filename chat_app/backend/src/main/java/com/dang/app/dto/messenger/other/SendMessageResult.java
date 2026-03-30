package com.dang.app.dto.messenger.other;

import com.dang.app.dto.messenger.response.MessageResponse;
import com.dang.app.entity.auth.User;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SendMessageResult {
    private MessageResponse response;
    private List<User> recipients;
}
