package com.dang.app.service.auth;

import com.dang.app.dto.auth.request.CompleteProfileRequest;
import com.dang.app.dto.auth.request.UpdateProfileInfoVisibilityRequest;
import com.dang.app.dto.auth.request.UpdateSecurityPrivateRequest;
import com.dang.app.dto.auth.request.UpdateProfileRequest;
import com.dang.app.dto.auth.request.UserProfileSearchRequest;
import com.dang.app.dto.auth.request.UserProfileRequest;
import com.dang.app.dto.auth.response.ProfileInfoSettingsResponse;
import com.dang.app.dto.auth.response.ProfileInfoVisibilityResponse;
import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfilePresenceResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.dto.auth.response.UserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSearchResponse;
import com.dang.app.dto.auth.response.UserSecurityPrivateResponse;
import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.messenger.ContactRepository;
import com.dang.app.repository.messenger.FriendshipRepository;
import com.dang.app.service.messenger.UserPresenceService;
import com.dang.app.utils.enums.FriendshipStatus;
import com.dang.app.utils.enums.OTPType;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.dto.auth.response.UserProfileOverviewResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfileInfoVisibility;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.repository.auth.UserProfileInfoVisibilityRepository;
import com.dang.app.repository.auth.UserProfileRepository;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.guard.UserProfileGuard;
import com.dang.app.utils.mapper.UserProfileMapper;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.*;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Validated
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    private static final int DISPLAY_NAME_SEARCH_LIMIT = 20;

    private final UserService userService;
    private final OTPService otpService;

    private final UserProfileRepository userProfileRepository;
    private final UserProfileInfoVisibilityRepository userProfileInfoVisibilityRepository;
    private final ContactRepository contactRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserPresenceService userPresenceService;

    private final UserGuard userGuard;
    private final UserProfileGuard userProfileGuard;

    private final UserProfileMapper userProfileMapper;
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");


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
        String normalizedEmail = normalize(email);
        String normalizedPhoneNumber = normalize(phoneNumber);
        String normalizedLastName = normalize(lastName);
        String normalizedFirstName = normalize(firstName);

        if (normalizedFirstName == null) {
            normalizedFirstName = "";
        }

        if (normalizedLastName == null) {
            normalizedLastName = "";
        }

        if(userProfileRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }

        // Phone number is optional for Google sign-up; only check uniqueness when provided.
        if(normalizedPhoneNumber != null && userProfileRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new BusinessException(ErrorCode.PHONENUMBER_EXISTS);
        }

        UserProfile createdProfile = UserProfile.builder()
                .user(user)
                .lastName(normalizedLastName)
                .firstName(normalizedFirstName)
                .email(normalizedEmail)
                .completed(false)
                .phoneNumber(normalizedPhoneNumber)
                .build();

        createdProfile.setDisplayName(
                resolveInitialDisplayName(
                        normalizedFirstName,
                        normalizedLastName,
                        normalizedPhoneNumber,
                        normalizedEmail
                )
        );

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
                maskUsername(profile.getUser().getUsername()),
                maskPhone(profile.getPhoneNumber()),
                maskEmail(profile.getEmail())
        );

    }

    public ProfileInfoSettingsResponse getMyProfileInfoSettings(UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        long friendCount = friendshipRepository.countAcceptedFriendsByUserId(userId);

        return userProfileMapper.toProfileInfoSettingsResponse(profile, friendCount);
    }

    @Transactional
    public ProfileInfoVisibilityResponse getMyProfileInfoVisibility(UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        UserProfileInfoVisibility visibility = getOrCreateProfileInfoVisibility(user);
        return userProfileMapper.toProfileInfoVisibilityResponse(visibility);
    }

    @Transactional
    public void updateMyProfileInfoVisibility(UUID userId, UpdateProfileInfoVisibilityRequest request) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        UserProfileInfoVisibility visibility = getOrCreateProfileInfoVisibility(user);
        userProfileMapper.applyProfileInfoVisibility(visibility, request);

        userProfileInfoVisibilityRepository.save(visibility);
    }

    public UserSecurityPrivateResponse getSecurityPrivateProfile(UUID userId) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        return userProfileMapper.toUserSecurityPrivateResponse(user, profile);
    }

    @Transactional
    public void updateSecurityPrivateProfile(UUID userId, UpdateSecurityPrivateRequest request) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        String normalizedUsername = normalize(request.getUsername());
        String normalizedPhoneNumber = normalize(request.getPhoneNumber());

        boolean shouldUpdateUsername = normalizedUsername != null && !normalizedUsername.equals(user.getUsername());
        boolean shouldUpdatePhoneNumber = normalizedPhoneNumber != null
                && !normalizedPhoneNumber.equals(profile.getPhoneNumber());

        if (!shouldUpdateUsername && !shouldUpdatePhoneNumber) {
            return;
        }

        if (shouldUpdateUsername) {
            userService.ensureUsernameCanBeUsedByAnotherField(user.getId(), normalizedUsername);
        }

        if (shouldUpdatePhoneNumber) {
            if (!PHONE_PATTERN.matcher(normalizedPhoneNumber).matches()) {
                throw new BusinessException(ErrorCode.INVALID_PHONE);
            }

            if (userProfileRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
                throw new BusinessException(ErrorCode.PHONENUMBER_EXISTS);
            }
        }

        OTPType otpType = shouldUpdateUsername
                ? OTPType.CHANGE_USERNAME_VERIFY
                : OTPType.CHANGE_PHONENUMBER_VERIFY;

        otpService.verifyOTP(userId, request.getOtp().trim(), otpType);

        if (shouldUpdateUsername) {
            userService.updateUsername(user, normalizedUsername);
        }

        if (shouldUpdatePhoneNumber) {
            profile.setPhoneNumber(normalizedPhoneNumber);
            userProfileRepository.save(profile);
        }
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
        UserProfileInfoVisibility visibility = userProfileInfoVisibilityRepository.findByUser_Id(userId)
                .orElse(null);

        return userProfileMapper.toPublicUserProfileResponse(
                userId,
                profile,
                nickName,
                status,
                friendsCount,
                visibility
        );
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

    public List<UserProfileSearchResponse> searchUserProfileByDisplayName(UUID myId, String displayName) {
        String normalizedDisplayName = normalize(displayName);
        if (normalizedDisplayName == null) {
            return List.of();
        }

        List<UserProfile> profiles = userProfileRepository.searchByDisplayName(
                normalizedDisplayName,
                PageRequest.of(0, DISPLAY_NAME_SEARCH_LIMIT));

        return profiles.stream()
                .map(profile -> userProfileMapper.toUserProfileSearchResponse(
                        profile,
                        getStatus(myId, profile.getUser().getId())))
                .toList();
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

        String normalizedFirstName = normalize(request.getFirstName());
        String normalizedLastName = normalize(request.getLastName());
        String normalizedPhoneNumber = normalize(request.getPhoneNumber());

        if (normalizedFirstName != null) {
            userProfile.setFirstName(normalizedFirstName);
        }

        if (normalizedLastName != null) {
            userProfile.setLastName(normalizedLastName);
        }

        if (normalizedPhoneNumber != null) {
            if (!PHONE_PATTERN.matcher(normalizedPhoneNumber).matches()) {
                throw new BusinessException(ErrorCode.INVALID_PHONE);
            }

            if (userProfileRepository.existsByPhoneNumberAndUser_IdNot(normalizedPhoneNumber, userId)) {
                throw new BusinessException(ErrorCode.PHONENUMBER_EXISTS);
            }

            userProfile.setPhoneNumber(normalizedPhoneNumber);
        }

        if (normalize(userProfile.getFirstName()) == null || normalize(userProfile.getLastName()) == null) {
            throw new BusinessException(ErrorCode.PROFILE_INCOMPLETE);
        }

        String currentPhoneNumber = normalize(userProfile.getPhoneNumber());
        if (currentPhoneNumber == null) {
            throw new BusinessException(ErrorCode.PROFILE_INCOMPLETE);
        }
        if (!PHONE_PATTERN.matcher(currentPhoneNumber).matches()) {
            throw new BusinessException(ErrorCode.INVALID_PHONE);
        }

        String displayName = resolveDisplayNameForCompletion(request.getDisplayName(), userProfile);
        if (displayName == null) {
            throw new BusinessException(ErrorCode.PROFILE_INCOMPLETE);
        }

        userProfile.setDisplayName(displayName);
        if (request.getAvatarUrl() != null) {
            userProfile.setAvatarUrl(request.getAvatarUrl().trim());
        }
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

    private UserProfileInfoVisibility getOrCreateProfileInfoVisibility(User user) {
        return userProfileInfoVisibilityRepository.findByUser_Id(user.getId())
                .orElseGet(() -> userProfileInfoVisibilityRepository.save(
                        UserProfileInfoVisibility.builder()
                                .user(user)
                                .build()
                ));
    }

    private String maskUsername(String username) {
        if (username == null || username.isBlank()) return "****";

        String normalized = username.trim();
        if (normalized.length() <= 2) {
            return normalized.charAt(0) + "***";
        }

        if (normalized.length() <= 4) {
            return normalized.substring(0, 1) + "***" + normalized.substring(normalized.length() - 1);
        }

        return normalized.substring(0, 2) + "***" + normalized.substring(normalized.length() - 2);
    }

    private String resolveInitialDisplayName(
            String firstName,
            String lastName,
            String phoneNumber,
            String email
    ) {
        String combinedName = normalize((firstName + " " + lastName).trim());
        if (combinedName != null) {
            return combinedName;
        }

        String normalizedPhone = normalize(phoneNumber);
        if (normalizedPhone != null) {
            return normalizedPhone;
        }

        String normalizedEmail = normalize(email);
        if (normalizedEmail != null) {
            int atIndex = normalizedEmail.indexOf('@');
            if (atIndex > 0) {
                String localPart = normalize(normalizedEmail.substring(0, atIndex));
                if (localPart != null) {
                    return localPart;
                }
            }
            return normalizedEmail;
        }

        return "user";
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveDisplayNameForCompletion(String requestedDisplayName, UserProfile profile) {
        String normalizedDisplayName = normalize(requestedDisplayName);
        if (normalizedDisplayName != null) {
            return normalizedDisplayName;
        }

        String normalizedCurrentDisplayName = normalize(profile.getDisplayName());
        if (normalizedCurrentDisplayName != null) {
            return normalizedCurrentDisplayName;
        }

        String firstName = normalize(profile.getFirstName());
        String lastName = normalize(profile.getLastName());
        if (firstName == null && lastName == null) {
            return null;
        }

        if (firstName == null) {
            return lastName;
        }

        if (lastName == null) {
            return firstName;
        }

        return (firstName + " " + lastName).trim();
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
