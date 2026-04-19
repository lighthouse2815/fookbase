package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Contact;
import com.dangngulon.frontend.feature.zola.domain.repository.IContactRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class ContactUseCase {
    private final IContactRepository repository;

    @Inject
    public ContactUseCase(IContactRepository repository) {
        this.repository = repository;
    }

    public CompletableFuture<AppResult<List<Contact>>> getAllContacts() {
        return repository.getAllContacts();
    }


}
