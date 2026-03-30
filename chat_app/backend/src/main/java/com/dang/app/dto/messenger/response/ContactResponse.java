package com.dang.app.dto.messenger.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ContactResponse {
    private UUID contactId;
    private UUID userId;
    private String avatarUrl;
    private String nickName;
    private String phoneNumber;

}
