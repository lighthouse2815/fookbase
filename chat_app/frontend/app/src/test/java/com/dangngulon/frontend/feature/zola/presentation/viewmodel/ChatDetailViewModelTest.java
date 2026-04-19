package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;
import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;
import com.dangngulon.frontend.feature.zola.domain.usecase.ChatDetailUseCase;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

public class ChatDetailViewModelTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

    private FakeChatRepository chatRepository;
    private ChatDetailViewModel viewModel;

    @Before
    public void setUp() {
        chatRepository = new FakeChatRepository();
        IMessageRepository messageRepository = new FakeMessageRepository();
        ChatDetailUseCase useCase = new ChatDetailUseCase(messageRepository, chatRepository);
        viewModel = new ChatDetailViewModel(useCase, new UserSessionUseCase(null));
    }

    @Test
    public void sendMessageRealTime_withoutConversationId_returnsFalseAndError() {
        boolean sent = viewModel.sendMessageRealTime("hello");

        assertFalse(sent);
        Result<MessageUiModel> result = viewModel.getSendMessageResult().getValue();
        assertEquals(Result.Status.ERROR, result.getStatus());
        assertEquals("Conversation ID not set", result.getMessage());
    }

    @Test
    public void sendMessageRealTime_emptyContent_returnsFalseAndValidationError() {
        viewModel.setConversationId("conversation-1");

        boolean sent = viewModel.sendMessageRealTime("  ");

        assertFalse(sent);
        Result<MessageUiModel> result = viewModel.getSendMessageResult().getValue();
        assertEquals(Result.Status.ERROR, result.getStatus());
        assertEquals("EMPTY_CONTENT", result.getMessage());
    }

    @Test
    public void setConversationId_whenSubscribed_unsubscribesOldSocketListener() {
        viewModel.setConversationId("conversation-1");
        viewModel.subscribeMessages();

        viewModel.setConversationId("conversation-2");

        assertEquals(1, chatRepository.subscribeCallCount);
        assertEquals(1, chatRepository.unsubscribeCallCount);
    }

    @Test
    public void unsubscribeMessages_clearsSubscription() {
        viewModel.setConversationId("conversation-1");
        viewModel.subscribeMessages();

        viewModel.unsubscribeMessages();

        assertEquals(1, chatRepository.unsubscribeCallCount);
    }

    private static class FakeChatRepository implements IChatRepository {
        private int subscribeCallCount;
        private int unsubscribeCallCount;

        @Override
        public Runnable subscribeMessages(String conversationId, Consumer<Message> onMessage) {
            subscribeCallCount++;
            return () -> unsubscribeCallCount++;
        }

        @Override
        public void sendMessage(SendMessageCommand command) {
        }
    }

    private static class FakeMessageRepository implements IMessageRepository {
        @Override
        public CompletableFuture<AppResult<Message>> sendMessage(SendMessageCommand command) {
            return CompletableFuture.completedFuture(AppResult.success(new Message()));
        }

        @Override
        public CompletableFuture<AppResult<MessageCursorPage>> getMessages(
                String conversationId,
                Instant cursorCreatedAt,
                String cursorMessageId,
                int limit
        ) {
            return CompletableFuture.completedFuture(
                    AppResult.success(new MessageCursorPage(Collections.emptyList(), null))
            );
        }
    }
}
