package com.dang.app.service.auth;

import com.dang.app.dto.auth.request.CompleteProfileRequest;
import com.dang.app.dto.auth.request.UpdateProfileRequest;
import com.dang.app.dto.auth.request.UserProfileSearchRequest;
import com.dang.app.dto.auth.request.UserProfileRequest;
import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfilePresenceResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.dto.auth.response.UserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSearchResponse;
import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.messenger.ContactRepository;
import com.dang.app.repository.messenger.FriendshipRepository;
import com.dang.app.service.messenger.UserPresenceService;
import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.dto.auth.response.UserProfileOverviewResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.repository.auth.UserProfileRepository;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.guard.UserProfileGuard;
import com.dang.app.utils.mapper.UserProfileMapper;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Validated
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    private final UserService userService;

    private final UserProfileRepository userProfileRepository;
    private final ContactRepository contactRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserPresenceService userPresenceService;

    private final UserGuard userGuard;
    private final UserProfileGuard userProfileGuard;

    private final UserProfileMapper userProfileMapper;


    /*
     Hàm tạo UserProfile : hàm này được thực hiện khi user đăng kí
    * 1. Kiểm tra username
    * 2. Kiểm tra status
    * 3. Kiểm tra mật khẩu
    * 4. Tạo token có : id, username, role
    * 5. Lấy displayName trong UserProfile
    */
    public UserProfile createProfile(
            User user,
            String phoneNumber,
            String email,
            String lastName,
            String firstName
    ) {
        if(userProfileRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }

        if(userProfileRepository.existsByPhoneNumber(phoneNumber)) {
            throw new BusinessException(ErrorCode.PHONENUMBER_EXISTS);
        }

        UserProfile createdProfile = UserProfile.builder()
                .user(user)
                .lastName(lastName)
                .firstName(firstName)
                .email(email)
                .completed(false)
                .phoneNumber(phoneNumber)
                .build();

        createdProfile.setDisplayName((firstName + " " + lastName).trim());

        return userProfileRepository.save(createdProfile);
    }


    /*
    * Hàm chỉnh sửa UserProfile
    *
    * */
    @Transactional
    public void updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile userProfile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        userProfileGuard.requireNotDeleted(userProfile);

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            userProfile.setFirstName(request.getFirstName().trim());
        }

        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            userProfile.setLastName(request.getLastName().trim());
        }

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            userProfile.setDisplayName(request.getDisplayName().trim());
        }

        if (request.getAvatarUrl() != null) {
            userProfile.setAvatarUrl(request.getAvatarUrl());
        }

        if (request.getBirthday() != null) {
            userProfile.setBirthDate(request.getBirthday());
        }

        if (request.getGender() != null) {
            userProfile.setGender(request.getGender());
        }

        userProfileRepository.save(userProfile);
    }


    /*
    * Hàm xóa UserProfile
    * */
    public void deleteProfile(User user) {
        // todo
    }
    /*
     Hàm lấy thông tin tổng quan user : phục vụ activity xem trang cá nhân
    */
    public UserProfileOverviewResponse getOverviewProfile(UUID userId){
        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        return userProfileMapper.toUserProfileOverviewResponse(
                profile,
                maskPhone(profile.getPhoneNumber()),
                maskEmail(profile.getEmail())
        );

    }


    @Transactional
    public void changeAvatar(String avatar, @NotNull UserProfile userProfile) {
        if(!((avatar == null && userProfile.getAvatarUrl() == null) ||
              Objects.equals(avatar, userProfile.getAvatarUrl())))
        {
            userProfile.setAvatarUrl(avatar);
            userProfileRepository.save(userProfile);
        }
    }


    /*
    * Hàm lấy thông tin profile
    * **/
    public UserProfileResponse getUserProfile(UUID myId, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUser_Id(request.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        userGuard.requireActiveAndNotDeleted(profile.getUser());

        String nickName = contactRepository.findNicknameByOwnerIdAndTargetId(myId, request.getUserId())
                .orElse(null);

        FriendshipStatus status = getStatus(myId, request.getUserId());

        return userProfileMapper.toUserProfileResponse(request.getUserId(), profile, nickName, status);
    }

    // todo sửa , đây là trả về cho trang cá nhân
    public PublicUserProfileResponse getPublicProfileByUserId(UUID myId,UUID userId) {
        UserProfile profile = userProfileRepository.findPublicByUserId(userId)
                .orElseThrow(() -> {
                    log.warn("Public profile lookup failed: userId={} not found", userId);
                    return new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
                });

        if (profile.getUser() == null || profile.getUser().getDeletedAt() != null) {
            log.warn("Public profile lookup failed: userId={} user was deleted", userId);
            throw new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
        }

        String nickName = contactRepository.findNicknameByOwnerIdAndTargetId(myId, userId)
                .orElse(null);

        FriendshipStatus status = getStatus(myId, userId);
        long friendsCount = friendshipRepository.countAcceptedFriendsByUserId(userId);

        return userProfileMapper.toPublicUserProfileResponse(userId, profile, nickName, status, friendsCount);
    }

    public UserProfileSummaryResponse getUserProfileSummary(UUID userId) {
        UserProfile profile = userProfileRepository.findPublicByUserId(userId)
                .orElseThrow(() -> {
                    log.warn("Profile summary lookup failed: userId={} not found", userId);
                    return new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
                });

        if (profile.getUser() == null || profile.getUser().getDeletedAt() != null) {
            log.warn("Profile summary lookup failed: userId={} user was deleted", userId);
            throw new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
        }

        return userProfileMapper.toUserProfileSummary(profile);
    }

    public List<UserProfilePresenceResponse> getFriendPresenceList(UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        List<UUID> friendIds = friendshipRepository.findAcceptedFriendIdsByUserId(userId);
        if (friendIds.isEmpty()) {
            return List.of();
        }

        Map<UUID, UserProfile> profileMap = userProfileRepository.findPublicProfilesByUserIds(friendIds)
                .stream()
                .collect(Collectors.toMap(
                        profile -> profile.getUser().getId(),
                        Function.identity(),
                        (left, ignored) -> left
                ));

        return friendIds.stream()
                .map(profileMap::get)
                .filter(Objects::nonNull)
                .map(profile -> {
                    UUID friendId = profile.getUser().getId();
                    boolean online = userPresenceService.isOnline(friendId);
                    return userProfileMapper.toUserProfilePresenceResponse(
                            profile,
                            online,
                            online ? null : userPresenceService.getLastSeenAt(friendId)
                    );
                })
                .toList();
    }


    /*
    * hàm search tìm bạn bằng số điện thoại
    * **/
    public UserProfileSearchResponse searchUserProfileByPhoneNumber(UUID myId, UserProfileSearchRequest request){
        UserProfile userProfile = userProfileRepository
                .findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new BusinessException(ErrorCode.PHONENUMBER_NOT_EXISTS)) ;

        FriendshipStatus status = getStatus(myId, userProfile.getUser().getId());

        return userProfileMapper.toUserProfileSearchResponse(userProfile, status);
    }


    /*
     * Hàm hoàn thành UserProfile : đăng nhập lần đầu
     *  1. Kiểm tra User
     *  2. Kiểm tra UserProfile
     *  3. Set thông tin cho Profile
     * */
    @Transactional
    public void completeProfile(UUID userId, CompleteProfileRequest request) {
        User user = userService.findById(userId);

        userGuard.requireActiveAndNotDeleted(user);

        UserProfile userProfile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() ->  new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        userProfileGuard.requireNotDeleted(userProfile);
        userProfileGuard.requireNotCompleted(userProfile);

        String displayName = request.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = (userProfile.getFirstName() + " " + userProfile.getLastName()).trim();
        }

        userProfile.setDisplayName(displayName);
        userProfile.setAvatarUrl(request.getAvatarUrl());
        userProfile.setBirthDate(request.getBirthday());
        userProfile.setGender(request.getGender());
        userProfile.setCompleted(true);

        userProfileRepository.save(userProfile);
    }


    //............... ham bo tro..................................................

    public Map<UUID, UserProfile> getProfileMapByUserIds( List<UUID> userIds) {
        return userProfileRepository.findByUser_IdIn(userIds)
                .stream()
                .collect(Collectors.toMap(
                        p -> p.getUser().getId(),
                        Function.identity()
                ));
    }


    /*
    * Hàm lấy danh sách displayName trong mảng userIds
    * row [1] : userId
    * row [2] : displayName
    * */
    public Map<UUID, String> getDisplayNameMap(Set<UUID> userIds) {
        return userProfileRepository.findDisplayNamesByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (String) row[1]
                ));
    }

    private String maskEmail(String email) {
        if (email == null) return null;
        int at = email.indexOf("@");
        if (at <= 2) return "****" + email.substring(at);
        return email.substring(0, 2) + "****" + email.substring(at);
    }


    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return "****";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    private FriendshipStatus getStatus(UUID myId, UUID userId) {
        UUID low = myId.compareTo(userId) < 0 ? myId : userId;
        UUID high = myId.compareTo(userId) < 0 ? userId : myId;

        Optional<Friendship> optional =
                friendshipRepository.findByUserLowIdAndUserHighId(low, high);

        if (optional.isEmpty()) {
            return FriendshipStatus.NONE;
        }

        Friendship f = optional.get();

        if (f.getStatus() == FriendshipStatus.PENDING) {
            return f.getRequester().getId().equals(myId)
                    ? FriendshipStatus.PENDING
                    : FriendshipStatus.INVITED;
        }

        return f.getStatus();
    }

}
