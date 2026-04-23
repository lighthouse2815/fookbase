package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.utils.enums.AttachmentType;
import com.dangngulon.frontend.feature.zola.domain.model.AttachmentCommand;
import com.dangngulon.frontend.feature.zola.domain.usecase.ChatDetailUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.AttachmentUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageCursorPageUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ChatDetailViewModel extends ViewModel {
    private final ChatDetailUseCase chatDetailUseCase;
    private final UserSessionUseCase userSessionUseCase;

    private final MutableLiveData<Result<MessageUiModel>> sendMessageResult = new MutableLiveData<>();
    private final MutableLiveData<Result<MessageCursorPageUiModel>> getMessagesResult = new MutableLiveData<>();
    private final MutableLiveData<Result<MessageCursorPageUiModel>> loadMoreMessagesResult = new MutableLiveData<>();
    private final MutableLiveData<MessageUiModel> messages = new MutableLiveData<>();

    private String currentConversationId;
    private MessageCursorPageUiModel currentMessages;
    private Runnable unsubscribeMessages;

    @Inject
    public ChatDetailViewModel(
            ChatDetailUseCase chatDetailUseCase,
            UserSessionUseCase userSessionUseCase
    ) {
        this.chatDetailUseCase = chatDetailUseCase;
        this.userSessionUseCase = userSessionUseCase;
    }

    public LiveData<Result<MessageUiModel>> getSendMessageResult() {
        return sendMessageResult;
    }

    public LiveData<Result<MessageCursorPageUiModel>> getGetMessagesResult() {
        return getMessagesResult;
    }

    public LiveData<Result<MessageCursorPageUiModel>> getLoadMoreMessagesResult() {
        return loadMoreMessagesResult;
    }

    public LiveData<MessageUiModel> getMessages() {
        return messages;
    }

    public String getCurrentUserId() {
        return userSessionUseCase.getCurrentUserId();
    }

    public void setConversationId(String conversationId) {
        clearMessageSubscription();
        this.currentConversationId = conversationId;
    }

    public void loadInitialMessages() {
        if (currentConversationId == null) {
            getMessagesResult.setValue(Result.error("Conversation ID not set"));
            return;
        }

        ViewModelHelper.callFuture(
                getMessagesResult,
                chatDetailUseCase.loadInitialMessages(currentConversationId).thenApply(this::toCursorPageUiResult)
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
                chatDetailUseCase
                        .loadMoreMessages(currentConversationId, cursorCreatedAt, cursorMessageId)
                        .thenApply(this::toCursorPageUiResult)
        );
    }

    public void sendMessage(String content, List<AttachmentUiModel> attachments) {
        if (currentConversationId == null) {
            sendMessageResult.setValue(Result.error("Conversation ID not set"));
            return;
        }

        ViewModelHelper.callFuture(
                sendMessageResult,
                chatDetailUseCase
                        .sendMessage(currentConversationId, content, ZolaUiMapper.toAttachmentCommands(attachments))
                        .thenApply(this::toMessageUiResult)
        );
    }

    public void sendMessage(String content) {
        sendMessage(content, null);
    }

    public void subscribeMessages() {
        if (currentConversationId == null) {
            return;
        }

        clearMessageSubscription();
        unsubscribeMessages = chatDetailUseCase.subscribeMessages(
                currentConversationId,
                value -> messages.postValue(ZolaUiMapper.toUiModel(value))
        );
    }

    public void unsubscribeMessages() {
        clearMessageSubscription();
    }

    public boolean sendMessageRealTime(String content) {
        return sendMessageRealTime(content, null);
    }

    public boolean sendMessageRealTime(String content, List<AttachmentUiModel> attachments) {
        if (currentConversationId == null) {
            sendMessageResult.setValue(Result.error("Conversation ID not set"));
            return false;
        }

        AppResult<Void> result = chatDetailUseCase.sendRealTime(
                currentConversationId,
                content,
                ZolaUiMapper.toAttachmentCommands(attachments)
        );
        if (result instanceof AppResult.Error<Void> error) {
            sendMessageResult.setValue(Result.error(error.getError().getMessage()));
            return false;
        }

        return true;
    }

    public CompletableFuture<AppResult<Void>> sendAttachmentMessage(
            byte[] fileBytes,
            String fileName,
            String contentType,
            AttachmentType attachmentType
    ) {
        if (currentConversationId == null) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError("Conversation ID not set"))
            );
        }

        if (fileBytes == null || fileBytes.length == 0) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError("File content is empty"))
            );
        }

        String safeFileName = (fileName == null || fileName.trim().isEmpty())
                ? "upload_" + System.currentTimeMillis()
                : fileName.trim();

        String safeContentType = (contentType == null || contentType.trim().isEmpty())
                ? "application/octet-stream"
                : contentType.trim();

        return chatDetailUseCase.uploadAttachment(safeFileName, safeContentType, fileBytes)
                .thenApply(uploadResult -> {
                    if (uploadResult instanceof AppResult.Error<String> uploadError) {
                        return AppResult.error(uploadError.getError());
                    }

                    String fileUrl = null;
                    if (uploadResult instanceof AppResult.Success<String> success) {
                        fileUrl = success.getData();
                    }

                    if (fileUrl == null || fileUrl.trim().isEmpty()) {
                        return AppResult.error(new AppError("Uploaded URL is empty"));
                    }

                    List<AttachmentCommand> attachmentCommands = new ArrayList<>();
                    attachmentCommands.add(new AttachmentCommand(
                            fileUrl,
                            safeFileName,
                            attachmentType,
                            (long) fileBytes.length,
                            safeContentType
                    ));

                    AppResult<Void> sendResult = chatDetailUseCase.sendRealTime(
                            currentConversationId,
                            null,
                            attachmentCommands
                    );

                    if (sendResult instanceof AppResult.Error<Void> sendError) {
                        return AppResult.error(sendError.getError());
                    }

                    return AppResult.success(null);
                });
    }

    public CompletableFuture<AppResult<String>> uploadAttachment(
            byte[] fileBytes,
            String fileName,
            String contentType
    ) {
        if (fileBytes == null || fileBytes.length == 0) {
            return CompletableFuture.completedFuture(
                    AppResult.error(new AppError("File content is empty"))
            );
        }

        String safeFileName = (fileName == null || fileName.trim().isEmpty())
                ? "upload_" + System.currentTimeMillis()
                : fileName.trim();

        String safeContentType = (contentType == null || contentType.trim().isEmpty())
                ? "application/octet-stream"
                : contentType.trim();

        return chatDetailUseCase.uploadAttachment(safeFileName, safeContentType, fileBytes);
    }

    public void setCurrentMessages(MessageCursorPageUiModel messages) {
        this.currentMessages = messages;
    }

    public MessageCursorPageUiModel getCurrentMessages() {
        return currentMessages;
    }

    public String getCurrentConversationId() {
        return currentConversationId;
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        clearMessageSubscription();
    }

    private void clearMessageSubscription() {
        if (unsubscribeMessages == null) {
            return;
        }

        unsubscribeMessages.run();
        unsubscribeMessages = null;
    }

    private AppResult<MessageUiModel> toMessageUiResult(
            AppResult<com.dangngulon.frontend.feature.zola.domain.model.Message> result
    ) {
        if (result instanceof AppResult.Success<com.dangngulon.frontend.feature.zola.domain.model.Message> success) {
            return AppResult.success(ZolaUiMapper.toUiModel(success.getData()));
        }

        if (result instanceof AppResult.Error<com.dangngulon.frontend.feature.zola.domain.model.Message> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected send message result"));
    }

    private AppResult<MessageCursorPageUiModel> toCursorPageUiResult(
            AppResult<com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage> result
    ) {
        if (result instanceof AppResult.Success<com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage> success) {
            return AppResult.success(ZolaUiMapper.toUiModel(success.getData()));
        }

        if (result instanceof AppResult.Error<com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected message page result"));
    }
}
