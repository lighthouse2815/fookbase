package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.ContactUseCase;
import com.dangngulon.frontend.domain.usecase.zola.CreateGroupUseCase;
import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.model.zola.response.RecentUserChatResponse;
import com.dangngulon.frontend.ui.zola.mapper.ContactMapper;
import com.dangngulon.frontend.ui.zola.model.SelectableContactItem;
import com.dangngulon.frontend.utils.enums.ConversationType;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;

import java.util.ArrayList;
import java.util.List;

import dagger.hilt.android.lifecycle.HiltViewModel;
import javax.inject.Inject;

@HiltViewModel
public class CreateGroupViewModel extends ViewModel {
    private final CreateGroupUseCase createGroupUseCase;
    private final ContactUseCase contactUseCase;

    @Inject
    public CreateGroupViewModel(CreateGroupUseCase createGroupUseCase, ContactUseCase contactUseCase) {
        this.createGroupUseCase = createGroupUseCase;
        this.contactUseCase = contactUseCase;
    }

    private final MutableLiveData<Result<ConversationResponse>> createConversationResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<RecentUserChatResponse>>> recentUserChatResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> selectablerecentUserChatItemResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<ContactResponse>>> contactResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> selectableContactItemResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> searchResult = new MutableLiveData<>();
    private List<SelectableContactItem> cacheContacts = new ArrayList<>();

    public LiveData<Result<ConversationResponse>> getCreateConversationResult() {
        return createConversationResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getselectableRecentUserChatItemResult() {
        return selectablerecentUserChatItemResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getselectableContactItemResult() {
        return selectableContactItemResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getSearchResult() {
        return searchResult;
    }

    public void createConversation(
            ConversationType type,
            String name,
            String createdBy,
            List<SelectableContactItem> members
    ) {
        List<String> memberIds = new ArrayList<>();
        for (SelectableContactItem item : members) {
            memberIds.add(item.getUserId());
        }

        ViewModelHelper.callFuture(
                createConversationResult,
                createGroupUseCase.createConversation(
                        type,
                        name,
                        createdBy,
                        memberIds
                )
        );
    }

    public void loadRecentUserChat() {
        ViewModelHelper.callFuture(
                recentUserChatResult,
                createGroupUseCase.getRecentUserChat()
        );
    }

    public void loadRecentUserChatItem() {
        loadRecentUserChat();
        recentUserChatResult.observeForever(result -> {
            if (result == null || result.getData() == null) return;

            List<SelectableContactItem> items =
                    ContactMapper.fromRecentUserChatResponseList(result.getData());

            selectablerecentUserChatItemResult.setValue(Result.success(items));
        });
    }

    public void loadContactChat() {
        ViewModelHelper.callFuture(
                contactResult,
                contactUseCase.getAllContacts()
        );
    }

    public void loadContactItem() {
        loadContactChat();
        contactResult.observeForever(result -> {
            if (result == null || result.getData() == null) return;

            List<SelectableContactItem> items =
                    ContactMapper.fromContactResponseList(result.getData());

            selectableContactItemResult.setValue(Result.success(items));
        });
    }

    public void setupSearch() {
        if (selectablerecentUserChatItemResult.getValue() == null) {
            loadRecentUserChat();
        }

        if (selectableContactItemResult.getValue() == null) {
            loadContactChat();
        }

        mergeContactLists();
    }
    
    private void mergeContactLists() {
        Result<List<SelectableContactItem>> recentResult = selectablerecentUserChatItemResult.getValue();
        Result<List<SelectableContactItem>> contactResultApi = selectableContactItemResult.getValue();
        
        if (recentResult != null && recentResult.getStatus() == Result.Status.SUCCESS &&
                contactResultApi != null && contactResultApi.getStatus() == Result.Status.SUCCESS) {
            
            List<SelectableContactItem> recentList = recentResult.getData();
            List<SelectableContactItem> contactList = contactResultApi.getData();

            cacheContacts = ContactMapper.mergeContactLists(recentList, contactList);
        }
    }

    public void search(String query) {
        setupSearch();
        List<SelectableContactItem> filtered = new ArrayList<>();

        for (SelectableContactItem item : cacheContacts) {
            boolean matchesPhone = item.getPhoneNumber() != null && 
                                item.getPhoneNumber().toLowerCase().contains(query.toLowerCase());
            boolean matchesName = item.getUsername() != null && 
                                item.getUsername().toLowerCase().contains(query.toLowerCase());
            
            if (matchesPhone || matchesName) {
                filtered.add(item);
            }
        }

        searchResult.setValue(Result.success(filtered));
    }

    public void onTabChanged(int position) {
        if (position == 0) {
            loadRecentUserChatItem();
        } else {
            loadContactItem();
        }
    }
}
