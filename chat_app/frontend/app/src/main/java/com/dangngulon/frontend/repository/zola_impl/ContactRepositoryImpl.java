package com.dangngulon.frontend.repository.zola_impl;

import com.dangngulon.frontend.api.zola.ContactApi;
import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.repository.zola.ContactRepository;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class ContactRepositoryImpl implements ContactRepository {

    private final ContactApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public ContactRepositoryImpl(ContactApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<List<ContactResponse>>> getAllContacts() {
        Call<List<ContactResponse>> call = api.getAllContact();
        return RetrofitFutureAdapter.enqueue(call, errorMapper);
    }


}
