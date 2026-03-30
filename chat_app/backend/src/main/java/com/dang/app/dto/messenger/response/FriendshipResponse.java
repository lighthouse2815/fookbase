package com.dang.app.dto.messenger.response;

import com.dang.app.entity.messenger.Friendship;
import com.dang.app.utils.enums.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class FriendshipResponse {

    private UUID friendShipId;              // id của friendship
    private UUID userId;           // người còn lại
    private String username;
//    private String avatar;

    private FriendshipStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updateAt;

}

