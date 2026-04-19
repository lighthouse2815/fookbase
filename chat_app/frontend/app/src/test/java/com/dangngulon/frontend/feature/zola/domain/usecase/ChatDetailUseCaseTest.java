package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.errors.ChatDetailError;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;
import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;

import org.junit.Before;
import org.junit.Test;

import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ChatDetailUseCaseTest {

    private FakeMessageRepository messageRepository;
    private FakeChatRepository chatRepository;
    private ChatDetailUseCase useCase;

    @Before
    public void setUp() {
        messageRepository = new FakeMessageRepository();
        chatRepository = new FakeChatRepository();
        useCase = new ChatDetailUseCase(messageRepository, chatRepository);
    }

    @Test
    public void sendRealTime_missingConversationId_returnsInvalidInputError() {
        AppResult<Void> result = useCase.sendRealTime(null, "hello", null);

        assertTrue(result instanceof AppResult.Error);
        AppResult.Error<Void> error = (AppResult.Error<Void>) result;
        assertEquals(ChatDetailError.INVALID_INPUT.name(), error.getError().getMessage());
        assertEquals(0, chatRepository.sendMessageCallCount);
    }

    @Test
    public void sendRealTime_emptyContent_returnsEmptyContentError() {
        AppResult<Void> result = useCase.sendRealTime("conversation-1", "   ", null);

        assertTrue(result instanceof AppResult.Error);
        AppResult.Error<Void> error = (AppResult.Error<Void>) result;
        assertEquals(ChatDetailError.EMPTY_CONTENT.name(), error.getError().getMessage());
        assertEquals(0, chatRepository.sendMessageCallCount);
    }

    @Test
    public void sendRealTime_validInput_callsChatRepository() {
        AppResult<Void> result = useCase.sendRealTime("conversation-1", "Hi", Collections.emptyList());

        assertTrue(result instanceof AppResult.Success);
        assertEquals(1, chatRepository.sendMessageCallCount);
        assertEquals("conversation-1", chatRepository.lastCommand.getConversationId());
        assertEquals("Hi", chatRepository.lastCommand.getContent());
    }

    @Test
    public void subscribeMessages_delegatesToChatRepository() {
        Runnable unsubscribe = useCase.subscribeMessages("conversation-9", message -> { });
        unsubscribe.run();

        assertEquals(1, chatRepository.subscribeCallCount);
        assertEquals(1, chatRepository.unsubscribeCallCount);
        assertEquals("conversation-9", chatRepository.lastConversationId);
    }

    private static class FakeChatRepository implements IChatRepository {
        private int sendMessageCallCount;
        private int subscribeCallCount;
        private int unsubscribeCallCount;
        private String lastConversationId;
        private SendMessageCommand lastCommand;

        @Override
        public Runnable subscribeMessages(String conversationId, Consumer<Message> onMessage) {
            subscribeCallCount++;
            lastConversationId = conversationId;
            return () -> unsubscribeCallCount++;
        }

        @Override
        public void sendMessage(SendMessageCommand command) {
            sendMessageCallCount++;
            lastCommand = command;
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
