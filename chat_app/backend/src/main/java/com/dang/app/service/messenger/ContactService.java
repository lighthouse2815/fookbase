package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.response.ContactResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.entity.messenger.Contact;
import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.messenger.ContactRepository;
import com.dang.app.repository.messenger.FriendshipRepository;
import com.dang.app.service.auth.UserProfileService;
import com.dang.app.service.auth.UserService;
import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.mapper.ContactMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContactService {
    private final UserProfileService userProfileService;
    private final UserService userService;

    private final ContactRepository contactRepository;
    private final FriendshipRepository friendshipRepository;

    private final ContactMapper contactMapper;

    private final UserGuard userGuard;


    /*
    * Hàm lấy tất cả contact
    * **/
    public List<ContactResponse> getAllContacts(UUID ownerId) {
        User user = userService.findById(ownerId);
        userGuard.requireActiveAndNotDeleted(user);

        return contactRepository.findContactTargetInfosByOwnerId(ownerId)
                .stream()
                .map(contactMapper::toContactResponse)
                .toList();
    }

    @Transactional
    public void createContact(UUID currentUserId, UUID otherUserId) {
        Friendship friendship = friendshipRepository.findBetween(currentUserId, otherUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FRIENDSHIP_NOT_FOUND));

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        User user1 = friendship.getRequester();
        User user2 = friendship.getAddressee();

        User currentUser = user1.getId().equals(currentUserId) ? user1 : user2;
        User otherUser = user1.getId().equals(currentUserId) ? user2 : user1;

        if (contactRepository.existsByOwnerAndTargetOrOwnerAndTarget(currentUser, otherUser, otherUser, currentUser)) {
            throw new BusinessException(ErrorCode.CONTACT_ALREADY_EXISTS);
        }

        Map<UUID, UserProfile> profiles =
                userProfileService.getProfileMapByUserIds(List.of(currentUserId, otherUserId));

        UserProfile userProfileCurrent = profiles.get(currentUserId);
        UserProfile userProfileOther = profiles.get(otherUserId);

        if (userProfileCurrent == null || userProfileOther == null) {
            throw new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
        }

        Contact currentUserContact = contactMapper.toContact(
                currentUser,
                otherUser,
                userProfileOther
        );

        contactRepository.saveAll(List.of(
                currentUserContact,
                contactMapper.toContact(
                        otherUser,
                        currentUser,
                        userProfileCurrent
                )
        ));
    }

    @Transactional
    public void deleteContact(UUID currentUserId, UUID otherUserId) {
        contactRepository.findByOwner_IdAndTarget_Id(currentUserId, otherUserId)
                .ifPresent(contactRepository::delete);

        contactRepository.findByOwner_IdAndTarget_Id(otherUserId, currentUserId)
                .ifPresent(contactRepository::delete);
    }
}
