package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Event;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;
import com.dangngulon.frontend.feature.zola.domain.usecase.AddFriendUseCase;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

public class AddFriendViewModelTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

    private AddFriendViewModel viewModel;

    @Before
    public void setUp() {
        AddFriendUseCase addFriendUseCase = new AddFriendUseCase(
                new FakeFriendshipRepository(),
                new FakeAddFriendProfileRepository()
        );
        viewModel = new AddFriendViewModel(addFriendUseCase, new UserSessionUseCase(null));
    }

    @Test
    public void handleQr_invalidContent_emitsErrorEvent() {
        viewModel.handleQr("invalid-qr-content");

        Event<String> event = viewModel.getErrorQrEvent().getValue();
        assertNotNull(event);
        assertEquals("Ma QR khong hop le", event.getContentIfNotHandled());
    }

    @Test
    public void handleQr_validContent_emitsUserIdEvent() {
        viewModel.handleQr("chat_app://user/user-01");

        Event<String> event = viewModel.getUserIdEvent().getValue();
        assertNotNull(event);
        assertEquals("user-01", event.getContentIfNotHandled());
    }

    private static class FakeFriendshipRepository implements IFriendshipRepository {
        @Override
        public CompletableFuture<AppResult<Friendship>> sendFriendRequest(FriendshipCommand command) {
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
        @Override
        public CompletableFuture<AppResult<AddFriendSearchProfile>> searchUserProfileByPhoneNumber(String phoneNumber) {
            return CompletableFuture.completedFuture(AppResult.success(null));
        }

        @Override
        public CompletableFuture<AppResult<AddFriendProfile>> getUserProfile(String userId) {
            return CompletableFuture.completedFuture(AppResult.success(null));
        }
    }
}
