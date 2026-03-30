package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.ContactResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.entity.messenger.Contact;
import com.dang.app.repository.projection.messenger.ContactTargetInfoProjection;
import org.springframework.stereotype.Component;

@Component
public class ContactMapper {

    public Contact toContact(
            User owner,
            User target,
            UserProfile targetProfile
    ) {
        return Contact.builder()
                .owner(owner)
                .target(target)
                .nickname(targetProfile.getDisplayName())
                .build();
    }

    public ContactResponse toContactResponse(
            ContactTargetInfoProjection projection
    ) {
        return ContactResponse.builder()
                .contactId(projection.getContactId())
                .userId(projection.getUserId())
                .nickName(projection.getNickname())
                .avatarUrl(projection.getAvatar())
                .phoneNumber(projection.getPhoneNumber())
                .build();
    }
}
