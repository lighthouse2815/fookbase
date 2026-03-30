package com.dangngulon.frontend.api.zola;

import com.dangngulon.frontend.model.zola.response.ContactResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface ContactApi {

    @GET("api/messenger/contacts/getByUser")
    Call<List<ContactResponse>> getAllContact();

}
