package com.dangngulon.frontend.domain.usecase.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.repository.zola.ContactRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class ContactUseCase {
    private final ContactRepository repository;

    @Inject
    public ContactUseCase(ContactRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<List<ContactResponse>>> getAllContacts() {
        return repository.getAllContacts();
    }


}
