package com.dangngulon.frontend.feature.zola.data.remote.api;

import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendProfileResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendSearchResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface AddFriendProfileApi {
    @GET("api/profiles")
    Call<AddFriendProfileResponse> getUserProfile(@Query("userId") String userId);

    @GET("api/profiles/search")
    Call<AddFriendSearchResponse> searchUserProfileByPhoneNumber(
            @Query("phoneNumber") String phoneNumber
    );
}
