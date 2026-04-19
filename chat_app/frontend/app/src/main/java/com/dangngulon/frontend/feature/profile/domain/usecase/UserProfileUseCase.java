package com.dangngulon.frontend.feature.profile.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.UserProfileError;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileDetail;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileSearchResult;
import com.dangngulon.frontend.feature.profile.domain.repository.IUserProfileRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class UserProfileUseCase {
    private final IUserProfileRepository userProfileRepository;

    @Inject
    public UserProfileUseCase(IUserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public CompletableFuture<AppResult<UserProfileOverview>> getOverviewProfile() {
        return userProfileRepository.getOverviewProfile();
    }

    public CompletableFuture<AppResult<UserProfileDetail>> getOtherUserProfile(String userId) {
        return userProfileRepository.getUserProfile(userId);
    }

    public CompletableFuture<AppResult<UserProfileSearchResult>> searchUserProfileByPhoneNumber(String phoneNumber) {
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

        return userProfileRepository.searchUserProfileByPhoneNumber(phoneNumber);
    }
}
