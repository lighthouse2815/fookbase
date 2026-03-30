package com.dang.app.dto.messenger.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentUserChatResponse {
    private String userId;
    private String username;
    private String avatar;
    private LocalDateTime lastChatTime;
}
