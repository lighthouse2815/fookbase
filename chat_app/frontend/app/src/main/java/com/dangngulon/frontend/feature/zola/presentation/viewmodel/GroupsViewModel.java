package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.feature.zola.domain.usecase.GroupUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class GroupsViewModel extends ViewModel {
    private final GroupUseCase groupUseCase;

    @Inject
    public GroupsViewModel(GroupUseCase groupUseCase) {
        this.groupUseCase = groupUseCase;
    }

    private final MutableLiveData<Result<List<ConversationUiModel>>> groupsListResult = new MutableLiveData<>();

    public LiveData<Result<List<ConversationUiModel>>> getGroupsListResult() {
        return groupsListResult;
    }

    public void getAllGroups() {
        ViewModelHelper.callFuture(
                groupsListResult,
                groupUseCase.getAllGroups().thenApply(this::toConversationUiResult)
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

        return AppResult.error(new AppError("Unexpected groups result"));
    }
}
