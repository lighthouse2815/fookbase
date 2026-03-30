package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.MessagesUseCase;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;
import com.dangngulon.frontend.utils.others.Result;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class MessagesViewModel extends ViewModel {
    private final MessagesUseCase messagesUseCase;

    private final MutableLiveData<Result<List<ConversationResponse>>> conversationListResult = new MutableLiveData<>();

    @Inject
    public MessagesViewModel(MessagesUseCase messagesUseCase) {
        this.messagesUseCase = messagesUseCase;
    }

    public LiveData<Result<List<ConversationResponse>>> getConversationListResult() {
        return conversationListResult;
    }


    public void getAllConversations() {
        ViewModelHelper.callFuture(
                conversationListResult,
                messagesUseCase.getAllConversations()
        );
    }





}
