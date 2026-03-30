package com.dangngulon.frontend.viewmodel.zola;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.domain.usecase.zola.ContactUseCase;
import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.viewmodel.common.helpers.ViewModelHelper;
import com.dangngulon.frontend.utils.others.Result;

import java.util.List;

import dagger.hilt.android.lifecycle.HiltViewModel;
import javax.inject.Inject;

@HiltViewModel
public class ContactViewModel extends ViewModel {
    private final ContactUseCase contactUseCase;

    private final MutableLiveData<Result<List<ContactResponse>>> contactListResult = new MutableLiveData<>();



    @Inject
    public ContactViewModel(ContactUseCase contactUseCase){
        this.contactUseCase = contactUseCase;
    }

    public MutableLiveData<Result<List<ContactResponse>>> getContactListResult() {
        return contactListResult;
    }

    public void getAllContacts() {
        ViewModelHelper.callFuture(
                contactListResult,
                contactUseCase.getAllContacts()
        );
    }





}
