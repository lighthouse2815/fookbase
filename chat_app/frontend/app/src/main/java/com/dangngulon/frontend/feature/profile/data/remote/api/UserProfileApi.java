package com.dangngulon.frontend.feature.profile.data.remote.api;

import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileSearchResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface UserProfileApi {
    @GET("api/profiles/me/overview")
    Call<UserProfileOverviewResponse> getOverviewProfile();

    @GET("api/profiles")
    Call<UserProfileResponse> getUserProfile(@Query("userId") String userId);

    @GET("api/profiles/search")
    Call<UserProfileSearchResponse> searchUserProfileByPhoneNumber(@Query("phoneNumber") String phoneNumber);
}
