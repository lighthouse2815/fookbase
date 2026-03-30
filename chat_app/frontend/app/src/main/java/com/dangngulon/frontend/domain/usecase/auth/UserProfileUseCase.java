package com.dangngulon.frontend.domain.usecase.auth;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.domain.common.errors.UserProfileError;
import com.dangngulon.frontend.model.auth.request.UserProfileRequest;
import com.dangngulon.frontend.model.auth.request.UserProfileSearchRequest;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;
import com.dangngulon.frontend.repository.auth.UserProfileRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class UserProfileUseCase {
    private final UserProfileRepository userProfileRepository;

    @Inject
    public UserProfileUseCase(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public CompletableFuture<AppResult<UserProfileOverviewResponse>> getOverviewProfile() {
        return userProfileRepository.getOverviewProfile();
    }

    public CompletableFuture<AppResult<UserProfileResponse>> getOtherUserProfile(String userId) {
        return userProfileRepository.getUserProfile(
                new UserProfileRequest(userId)
        );
    }

    public CompletableFuture<AppResult<UserProfileSearchResponse>> searchUserProfileByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(UserProfileError.PHONE_NUMBER_EMPTY.name()))
            );
        }

        phoneNumber = phoneNumber.trim();
        
        if (phoneNumber.length() < 9) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(UserProfileError.PHONE_NUMBER_INVALID.name()))
            );
        }

        return userProfileRepository.searchUserProfileByPhoneNumber(
                new UserProfileSearchRequest(phoneNumber)
        );
    }
}
