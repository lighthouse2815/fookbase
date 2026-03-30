package com.dang.app.utils.mapper;

import com.dang.app.dto.auth.response.UserBasicResponse;
import com.dang.app.entity.auth.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserBasicResponse toUserBasicResponse(User user) {
        return UserBasicResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .build();
    }
}
