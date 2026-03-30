package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.GroupUseCase;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

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

    private final MutableLiveData<Result<List<ConversationResponse>>> groupsListResult = new MutableLiveData<>();

    public MutableLiveData<Result<List<ConversationResponse>>> getGroupsListResult() {
        return groupsListResult;
    }

    public void getAllGroups() {
        ViewModelHelper.callFuture(
                groupsListResult,
                groupUseCase.getAllGroups()
        );
    }

}
