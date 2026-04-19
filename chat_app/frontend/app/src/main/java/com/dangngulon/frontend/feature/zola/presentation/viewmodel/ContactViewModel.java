package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.viewmodel.helpers.ViewModelHelper;
import com.dangngulon.frontend.feature.zola.domain.usecase.ContactUseCase;
import com.dangngulon.frontend.feature.zola.presentation.mapper.ZolaUiMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.ContactUiModel;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ContactViewModel extends ViewModel {
    private final ContactUseCase contactUseCase;
    private final MutableLiveData<Result<List<ContactUiModel>>> contactListResult =
            new MutableLiveData<>();

    @Inject
    public ContactViewModel(ContactUseCase contactUseCase) {
        this.contactUseCase = contactUseCase;
    }

    public LiveData<Result<List<ContactUiModel>>> getContactListResult() {
        return contactListResult;
    }

    public void getAllContacts() {
        ViewModelHelper.callFuture(
                contactListResult,
                contactUseCase.getAllContacts().thenApply(this::toContactUiResult)
        );
    }

    private AppResult<List<ContactUiModel>> toContactUiResult(
            AppResult<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> result
    ) {
        if (result instanceof AppResult.Success<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> success) {
            return AppResult.success(ZolaUiMapper.toContactUiList(success.getData()));
        }

        if (result instanceof AppResult.Error<List<com.dangngulon.frontend.feature.zola.domain.model.Contact>> error) {
            return AppResult.error(error.getError());
        }

        return AppResult.error(new AppError("Unexpected contacts result"));
    }
}
