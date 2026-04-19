package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.usecase.UserSessionUseCase;
import com.dangngulon.frontend.feature.zola.domain.usecase.ContactUseCase;
import com.dangngulon.frontend.feature.zola.domain.usecase.CreateGroupUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ContactMapper;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.SelectableContactItem;
import com.dangngulon.frontend.core.utils.enums.ConversationType;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import dagger.hilt.android.lifecycle.HiltViewModel;
import javax.inject.Inject;

@HiltViewModel
public class CreateGroupViewModel extends ViewModel {
    private final CreateGroupUseCase createGroupUseCase;
    private final ContactUseCase contactUseCase;
    private final UserSessionUseCase userSessionUseCase;

    @Inject
    public CreateGroupViewModel(
            CreateGroupUseCase createGroupUseCase,
            ContactUseCase contactUseCase,
            UserSessionUseCase userSessionUseCase
    ) {
        this.createGroupUseCase = createGroupUseCase;
        this.contactUseCase = contactUseCase;
        this.userSessionUseCase = userSessionUseCase;
    }

    private final MutableLiveData<Result<ConversationUiModel>> createConversationResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> selectableRecentUserChatItemResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> selectableContactItemResult = new MutableLiveData<>();
    private final MutableLiveData<Result<List<SelectableContactItem>>> searchResult = new MutableLiveData<>();
    private final List<SelectableContactItem> recentUserChatCache = new ArrayList<>();
    private final List<SelectableContactItem> contactItemCache = new ArrayList<>();
    private List<SelectableContactItem> cacheContacts = new ArrayList<>();
    private String currentSearchQuery = "";
    private boolean hasRequestedRecentUserChat;
    private boolean hasRequestedContacts;

    public LiveData<Result<ConversationUiModel>> getCreateConversationResult() {
        return createConversationResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getSelectableRecentUserChatItemResult() {
        return selectableRecentUserChatItemResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getSelectableContactItemResult() {
        return selectableContactItemResult;
    }

    public LiveData<Result<List<SelectableContactItem>>> getSearchResult() {
        return searchResult;
    }

    public void createConversation(
            ConversationType type,
            String name,
            List<SelectableContactItem> members
    ) {
        String createdBy = userSessionUseCase.getCurrentUserId();
        if (createdBy == null || createdBy.trim().isEmpty()) {
            createConversationResult.setValue(Result.error("Khong tim thay thong tin nguoi dung"));
            return;
        }

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
                ).thenApply(this::toConversationUiResult)
        );
    }

    public void loadRecentUserChatItem() {
        hasRequestedRecentUserChat = true;
        selectableRecentUserChatItemResult.setValue(Result.loading());
        createGroupUseCase.getRecentUserChat()
                .thenAccept(this::handleRecentUserChatResult);
    }

    public void loadContactItem() {
        hasRequestedContacts = true;
        selectableContactItemResult.setValue(Result.loading());
        contactUseCase.getAllContacts()
                .thenAccept(this::handleContactResult);
    }

    public void setupSearch() {
        if (!hasRequestedRecentUserChat) {
            loadRecentUserChatItem();
        }

        if (!hasRequestedContacts) {
            loadContactItem();
        }
    }

    private void handleRecentUserChatResult(
            AppResult<List<com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat>> appResult
    ) {
        if (appResult instanceof AppResult.Success<List<com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat>> success) {
            List<SelectableContactItem> items =
                    ContactMapper.fromRecentUserChatList(success.getData());

            recentUserChatCache.clear();
            if (items != null) {
                recentUserChatCache.addAll(items);
            }
            mergeContactLists();

            selectableRecentUserChatItemResult.postValue(Result.success(items));
            return;
        }

        if (appResult instanceof AppResult.Error<List<com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat>> error) {
            selectableRecentUserChatItemResult.postValue(
                    Result.error(error.getError().getMessage())
            );
        }
    }

    private void handleContactResult(
            AppResult<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> appResult
    ) {
        if (appResult instanceof AppResult.Success<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> success) {
            List<SelectableContactItem> items =
                    ContactMapper.fromContactList(success.getData());

            contactItemCache.clear();
            if (items != null) {
                contactItemCache.addAll(items);
            }
            mergeContactLists();

            selectableContactItemResult.postValue(Result.success(items));
            return;
        }

        if (appResult instanceof AppResult.Error<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> error) {
            selectableContactItemResult.postValue(
                    Result.error(error.getError().getMessage())
            );
        }
    }
    
    private void mergeContactLists() {
        cacheContacts = ContactMapper.mergeContactLists(recentUserChatCache, contactItemCache);
        applySearchQuery();
    }

    public void search(String query) {
        currentSearchQuery = query == null ? "" : query.trim();
        setupSearch();
        applySearchQuery();
    }

    private void applySearchQuery() {
        if (cacheContacts.isEmpty()) {
            searchResult.setValue(Result.success(new ArrayList<>()));
            return;
        }

        if (currentSearchQuery.isEmpty()) {
            searchResult.setValue(Result.success(new ArrayList<>(cacheContacts)));
            return;
        }

        String normalizedQuery = currentSearchQuery.toLowerCase(Locale.ROOT);
        List<SelectableContactItem> filtered = new ArrayList<>();

        for (SelectableContactItem item : cacheContacts) {
            boolean matchesPhone = item.getPhoneNumber() != null
                    && item.getPhoneNumber().toLowerCase(Locale.ROOT).contains(normalizedQuery);
            boolean matchesName = item.getUsername() != null
                    && item.getUsername().toLowerCase(Locale.ROOT).contains(normalizedQuery);
            
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

    private AppResult<ConversationUiModel> toConversationUiResult(
            AppResult<com.dangngulon.frontend.feature.zola.domain.model.Conversation> result
    ) {
        if (result instanceof AppResult.Success<com.dangngulon.frontend.feature.zola.domain.model.Conversation> success) {
            return AppResult.success(ZolaUiMapper.toUiModel(success.getData()));
        }

        if (result instanceof AppResult.Error<com.dangngulon.frontend.feature.zola.domain.model.Conversation> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected create conversation result"));
    }
}
