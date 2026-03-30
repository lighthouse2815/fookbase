package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MediatorLiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.ChatDetailUseCase;
import com.dangngulon.frontend.model.zola.request.AttachmentRequest;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;
import com.dangngulon.frontend.utils.others.Result;

import java.time.Instant;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ChatDetailViewModel extends ViewModel {
    private final ChatDetailUseCase chatDetailUseCase;

    private final MutableLiveData<Result<MessageResponse>> sendMessageResult = new MutableLiveData<>();
    private final MutableLiveData<Result<MessageCursorPageResponse>> getMessagesResult = new MutableLiveData<>();
    private final MutableLiveData<Result<MessageCursorPageResponse>> loadMoreMessagesResult = new MutableLiveData<>();

    private String currentConversationId;
    private MessageCursorPageResponse currentMessages;

    private final MediatorLiveData<MessageResponse> _messages = new MediatorLiveData<>();
    public LiveData<MessageResponse> messages = _messages;
    private LiveData<MessageResponse> currentSource;

    @Inject
    public ChatDetailViewModel(ChatDetailUseCase chatDetailUseCase) {
        this.chatDetailUseCase = chatDetailUseCase;
    }

    public LiveData<Result<MessageResponse>> getSendMessageResult() {
        return sendMessageResult;
    }

    public LiveData<Result<MessageCursorPageResponse>> getGetMessagesResult() {
        return getMessagesResult;
    }

    public LiveData<Result<MessageCursorPageResponse>> getLoadMoreMessagesResult() {
        return loadMoreMessagesResult;
    }

    public void setConversationId(String conversationId) {
        if (this.currentConversationId != null && currentSource != null) {
            _messages.removeSource(currentSource);
            currentSource = null;
        }

        this.currentConversationId = conversationId;
    }

    public void loadInitialMessages() {
        if (currentConversationId == null) {
            getMessagesResult.setValue(Result.error("Conversation ID not set"));
            return;
        }

        ViewModelHelper.callFuture(
                getMessagesResult,
                chatDetailUseCase.loadInitialMessages(currentConversationId)
        );
    }

    public void loadMoreMessages() {
        if (currentConversationId == null || currentMessages == null || currentMessages.getNextCursor() == null) {
            loadMoreMessagesResult.setValue(Result.error("No more messages to load"));
            return;
        }

        Instant cursorCreatedAt = currentMessages.getNextCursor().getCreatedAt();
        String cursorMessageId = currentMessages.getNextCursor().getMessageId();

        ViewModelHelper.callFuture(
                loadMoreMessagesResult,
                chatDetailUseCase.loadMoreMessages(currentConversationId, cursorCreatedAt, cursorMessageId)
        );
    }

    public void sendMessage(String content, List<AttachmentRequest> attachments) {
        if (currentConversationId == null) {
            sendMessageResult.setValue(Result.error("Conversation ID not set"));
            return;
        }

        ViewModelHelper.callFuture(
                sendMessageResult,
                chatDetailUseCase.sendMessage(currentConversationId, content, attachments)
        );
    }

    public void sendMessage(String content) {
        sendMessage(content, null);
    }

    public void subscribeMessages(String userId) {
        if (currentConversationId == null) return;

        if (currentSource != null) {
            _messages.removeSource(currentSource);
        }

        currentSource =
                chatDetailUseCase.SubscribeMessages(currentConversationId, userId);

        _messages.addSource(currentSource, _messages::postValue);
    }

    public void sendMessageRealTime(String content) {
        if (currentConversationId == null) {
            sendMessageResult.setValue(Result.error("Conversation ID not set"));
            return;
        }

        chatDetailUseCase.sendRealTime(currentConversationId, content, null);
    }

    public void setCurrentMessages(MessageCursorPageResponse messages) {
        this.currentMessages = messages;
    }

    public MessageCursorPageResponse getCurrentMessages() {
        return currentMessages;
    }

    public String getCurrentConversationId() {
        return currentConversationId;
    }
}
