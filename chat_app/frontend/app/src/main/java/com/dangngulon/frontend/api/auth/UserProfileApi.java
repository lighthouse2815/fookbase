package com.dangngulon.frontend.api.auth;

import com.dangngulon.frontend.model.auth.request.UserProfileRequest;
import com.dangngulon.frontend.model.auth.request.UserProfileSearchRequest;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface UserProfileApi {
    @GET("api/profiles/me/overview")
    Call<UserProfileOverviewResponse> getOverviewProfile();

    @GET("api/profiles")
    Call<UserProfileResponse> getUserProfile(UserProfileRequest request);

    @GET("api/profiles/search")
    Call<UserProfileSearchResponse> searchUserProfileByPhoneNumber(@Query("phoneNumber") String phoneNumber);
}