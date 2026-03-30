package com.dangngulon.frontend.repository.zola;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.response.ContactResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface ContactRepository {

    CompletableFuture<AppResult<List<ContactResponse>>> getAllContacts();


}
