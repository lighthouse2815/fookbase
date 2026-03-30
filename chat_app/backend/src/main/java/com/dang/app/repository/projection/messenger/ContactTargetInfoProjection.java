package com.dang.app.repository.projection.messenger;

import java.util.UUID;

public interface ContactTargetInfoProjection {
    UUID getContactId();

    UUID getUserId();

    String getNickname();

    String getAvatar();

    String getPhoneNumber();
}
