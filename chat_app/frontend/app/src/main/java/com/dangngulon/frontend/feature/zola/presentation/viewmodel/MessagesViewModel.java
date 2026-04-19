package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.feature.zola.domain.usecase.MessagesUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class MessagesViewModel extends ViewModel {
    private final MessagesUseCase messagesUseCase;

    private final MutableLiveData<Result<List<ConversationUiModel>>> conversationListResult = new MutableLiveData<>();

    @Inject
    public MessagesViewModel(MessagesUseCase messagesUseCase) {
        this.messagesUseCase = messagesUseCase;
    }

    public LiveData<Result<List<ConversationUiModel>>> getConversationListResult() {
        return conversationListResult;
    }

    public void getAllConversations() {
        ViewModelHelper.callFuture(
                conversationListResult,
                messagesUseCase.getAllConversations().thenApply(this::toConversationUiResult)
        );
    }

    private AppResult<List<ConversationUiModel>> toConversationUiResult(
            AppResult<List<com.dangngulon.frontend.feature.zola.domain.model.Conversation>> result
    ) {
        if (result instanceof AppResult.Success<List<com.dangngulon.frontend.feature.zola.domain.model.Conversation>> success) {
            return AppResult.success(ZolaUiMapper.toConversationUiList(success.getData()));
        }

        if (result instanceof AppResult.Error<List<com.dangngulon.frontend.feature.zola.domain.model.Conversation>> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected conversation list result"));
    }
}
