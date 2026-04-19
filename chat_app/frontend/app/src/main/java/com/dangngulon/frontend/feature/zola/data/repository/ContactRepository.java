package com.dangngulon.frontend.feature.zola.data.repository;

import com.dangngulon.frontend.feature.zola.data.remote.api.ContactApi;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.feature.zola.data.mapper.ContactDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.ContactResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Contact;
import com.dangngulon.frontend.feature.zola.domain.repository.IContactRepository;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.adapter.RetrofitFutureAdapter;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;
import javax.inject.Singleton;

import retrofit2.Call;

@Singleton
public class ContactRepository implements IContactRepository {

    private final ContactApi api;
    private final ApiErrorMapper errorMapper;

    @Inject
    public ContactRepository(ContactApi api, ApiErrorMapper errorMapper) {
        this.api = api;
        this.errorMapper = errorMapper;
    }

    @Override
    public CompletableFuture<AppResult<List<Contact>>> getAllContacts() {
        Call<List<ContactResponse>> call = api.getAllContact();
        return RetrofitFutureAdapter.enqueue(call, errorMapper)
                .thenApply(result -> {
                    if (result instanceof AppResult.Success<List<ContactResponse>> success) {
                        return AppResult.success(ContactDataMapper.toDomainList(success.getData()));
                    }

                    if (result instanceof AppResult.Error<List<ContactResponse>> error) {
                        return AppResult.error(error.getError());
                    }

                    return AppResult.error(new AppError("Unexpected contacts result"));
                });
    }


}
