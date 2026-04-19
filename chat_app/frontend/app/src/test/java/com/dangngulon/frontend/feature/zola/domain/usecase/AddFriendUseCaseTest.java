package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.AddFriendError;
import com.dangngulon.frontend.core.common.errors.UserProfileError;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;

import org.junit.Before;
import org.junit.Test;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public class AddFriendUseCaseTest {

    private FakeFriendshipRepository friendshipRepository;
    private FakeAddFriendProfileRepository addFriendProfileRepository;
    private AddFriendUseCase useCase;

    @Before
    public void setUp() {
        friendshipRepository = new FakeFriendshipRepository();
        addFriendProfileRepository = new FakeAddFriendProfileRepository();
        useCase = new AddFriendUseCase(friendshipRepository, addFriendProfileRepository);
    }

    @Test
    public void parseQrUserId_validFormat_returnsUserId() {
        String result = useCase.parseQrUserId("chat_app://user/abc123");

        assertEquals("abc123", result);
    }

    @Test
    public void buildQrContent_emptyUserId_returnsNull() {
        String qrContent = useCase.buildQrContent("   ");

        assertNull(qrContent);
    }

    @Test
    public void sendFriendRequest_emptyUserId_returnsValidationError() {
        AppResult<Friendship> result = useCase.sendFriendRequest("   ").join();

        assertTrue(result instanceof AppResult.Error);
        AppResult.Error<Friendship> error = (AppResult.Error<Friendship>) result;
        assertEquals(AddFriendError.USER_ID_EMPTY.name(), error.getError().getMessage());
        assertEquals(0, friendshipRepository.sendFriendRequestCallCount);
    }

    @Test
    public void sendFriendRequest_trimmedUserId_callsRepositoryWithTrimmedValue() {
        useCase.sendFriendRequest("  user-01  ").join();

        assertEquals(1, friendshipRepository.sendFriendRequestCallCount);
        assertEquals("user-01", friendshipRepository.lastCommand.getUserId());
    }

    @Test
    public void searchUserProfileByPhoneNumber_emptyPhone_returnsValidationError() {
        AppResult<AddFriendSearchProfile> result =
                useCase.searchUserProfileByPhoneNumber("   ").join();

        assertTrue(result instanceof AppResult.Error);
        AppResult.Error<AddFriendSearchProfile> error = (AppResult.Error<AddFriendSearchProfile>) result;
        assertEquals(UserProfileError.PHONE_NUMBER_EMPTY.name(), error.getError().getMessage());
        assertEquals(0, addFriendProfileRepository.searchByPhoneCallCount);
    }

    @Test
    public void searchUserProfileByPhoneNumber_validPhone_callsRepositoryWithTrimmedValue() {
        useCase.searchUserProfileByPhoneNumber(" 0123456789 ").join();

        assertEquals(1, addFriendProfileRepository.searchByPhoneCallCount);
        assertEquals("0123456789", addFriendProfileRepository.lastPhoneNumber);
    }

    @Test
    public void getUserProfile_emptyUserId_returnsValidationError() {
        AppResult<AddFriendProfile> result = useCase.getUserProfile(" ").join();

        assertTrue(result instanceof AppResult.Error);
        AppResult.Error<AddFriendProfile> error = (AppResult.Error<AddFriendProfile>) result;
        assertEquals(AddFriendError.USER_ID_EMPTY.name(), error.getError().getMessage());
        assertEquals(0, addFriendProfileRepository.getUserProfileCallCount);
    }

    private static class FakeFriendshipRepository implements IFriendshipRepository {
        private int sendFriendRequestCallCount;
        private FriendshipCommand lastCommand;

        @Override
        public CompletableFuture<AppResult<Friendship>> sendFriendRequest(FriendshipCommand command) {
            sendFriendRequestCallCount++;
            lastCommand = command;
            return CompletableFuture.completedFuture(AppResult.success(new Friendship()));
        }

        @Override
        public CompletableFuture<AppResult<Friendship>> acceptFriendRequest(FriendshipCommand command) {
            return CompletableFuture.completedFuture(AppResult.success(new Friendship()));
        }

        @Override
        public CompletableFuture<AppResult<Void>> rejectFriendRequest(FriendshipCommand command) {
            return CompletableFuture.completedFuture(AppResult.success(null));
        }

        @Override
        public CompletableFuture<AppResult<List<PendingFriendRequester>>> getPendingRequesters() {
            return CompletableFuture.completedFuture(AppResult.success(Collections.emptyList()));
        }
    }

    private static class FakeAddFriendProfileRepository implements IAddFriendProfileRepository {
        private int searchByPhoneCallCount;
        private int getUserProfileCallCount;
        private String lastPhoneNumber;

        @Override
        public CompletableFuture<AppResult<AddFriendSearchProfile>> searchUserProfileByPhoneNumber(String phoneNumber) {
            searchByPhoneCallCount++;
            lastPhoneNumber = phoneNumber;
            return CompletableFuture.completedFuture(AppResult.success(null));
        }

        @Override
        public CompletableFuture<AppResult<AddFriendProfile>> getUserProfile(String userId) {
            getUserProfileCallCount++;
            return CompletableFuture.completedFuture(AppResult.success(null));
        }
    }
}
