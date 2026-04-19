package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.errors.AddFriendError;
import com.dangngulon.frontend.core.common.errors.UserProfileError;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class AddFriendUseCase {
    private static final String QR_USER_PREFIX = "chat_app://user/";

    private final IFriendshipRepository friendShipRepository;
    private final IAddFriendProfileRepository addFriendProfileRepository;

    @Inject
    public AddFriendUseCase(
            IFriendshipRepository friendShipRepository,
            IAddFriendProfileRepository addFriendProfileRepository
    ){
        this.friendShipRepository = friendShipRepository;
        this.addFriendProfileRepository = addFriendProfileRepository;
    }

    public String parseQrUserId(String content){
        if (content == null || content.isBlank()) {
            return null;
        }

        String normalized = content.trim();
        if (!normalized.startsWith(QR_USER_PREFIX)) {
            return null;
        }

        String userId = normalized.substring(QR_USER_PREFIX.length());
        if (userId.isBlank() || userId.contains("/")) {
            return null;
        }

        return userId;
    }

    public String buildQrContent(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return null;
        }

        return QR_USER_PREFIX + userId.trim();
    }

    public CompletableFuture<AppResult<Friendship>> sendFriendRequest(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(AddFriendError.USER_ID_EMPTY.name()))
            );
        }

        return friendShipRepository.sendFriendRequest(
                new FriendshipCommand(userId.trim())
        );
    }

    public CompletableFuture<AppResult<AddFriendSearchProfile>> searchUserProfileByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(UserProfileError.PHONE_NUMBER_EMPTY.name()))
            );
        }

        String normalizedPhoneNumber = phoneNumber.trim();
        if (normalizedPhoneNumber.length() < 9) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(UserProfileError.PHONE_NUMBER_INVALID.name()))
            );
        }

        return addFriendProfileRepository.searchUserProfileByPhoneNumber(normalizedPhoneNumber);
    }

    public CompletableFuture<AppResult<AddFriendProfile>> getUserProfile(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError(AddFriendError.USER_ID_EMPTY.name()))
            );
        }

        return addFriendProfileRepository.getUserProfile(userId.trim());
    }
}
