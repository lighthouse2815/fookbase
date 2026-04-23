package com.dangngulon.frontend.feature.zola.data.remote.api;

import java.util.Map;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.PartMap;
import retrofit2.http.Url;

public interface UploadApi {

    @GET("api/media/cloudinary-signature")
    Call<Map<String, Object>> getCloudinarySignature();

    @Multipart
    @POST
    Call<Map<String, Object>> uploadToCloudinary(
            @Url String uploadUrl,
            @PartMap Map<String, RequestBody> fields,
            @Part MultipartBody.Part file
    );
}
