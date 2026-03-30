package com.dangngulon.frontend.api.zola;

import com.dangngulon.frontend.model.zola.request.FriendshipRequest;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface FriendShipApi {
    @POST("api/messenger/friendships")
    Call<FriendshipResponse> sendFriendRequest(@Body FriendshipRequest request);

    @POST("api/messenger/friendships/accept")
    Call<FriendshipResponse> acceptFriendRequest(@Body FriendshipRequest request);

    @POST("api/messenger/friendships/reject")
    Call<Void> rejectFriendRequest(@Body FriendshipRequest request);

    @GET("api/messenger/friendships/pending-requesters")
    Call<List<PendingFriendRequesterResponse>> getPendingRequesters();
}
