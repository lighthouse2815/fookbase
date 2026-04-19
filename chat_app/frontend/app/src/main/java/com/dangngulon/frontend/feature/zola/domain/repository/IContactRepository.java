package com.dangngulon.frontend.feature.zola.domain.repository;

import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.domain.model.Contact;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface IContactRepository {

    CompletableFuture<AppResult<List<Contact>>> getAllContacts();


}
