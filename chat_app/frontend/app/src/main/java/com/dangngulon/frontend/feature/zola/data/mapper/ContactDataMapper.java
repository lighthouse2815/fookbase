package com.dangngulon.frontend.feature.zola.data.mapper;

import com.dangngulon.frontend.core.utils.AvatarDefaults;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.ContactResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Contact;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

public final class ContactDataMapper {

    private ContactDataMapper() {
    }

    public static Contact toDomain(ContactResponse response) {
        if (response == null) {
            return null;
        }

        return new Contact(
                uuidToString(response.getContactId()),
                uuidToString(response.getUserId()),
                AvatarDefaults.resolve(response.getAvatarUrl()),
                response.getNickName(),
                response.getPhoneNumber()
        );
    }

    public static List<Contact> toDomainList(List<ContactResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(ContactDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private static String uuidToString(UUID value) {
        return value == null ? null : value.toString();
    }
}
