package com.dangngulon.frontend.feature.zola.data.remote.api;

import com.dangngulon.frontend.feature.zola.data.remote.dto.request.ConversationCreateRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.ConversationResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.RecentUserChatResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface ConversationApi {

    @POST("api/messenger/conversations/create")
    Call<ConversationResponse> createConversation(@Body ConversationCreateRequest request);

    @GET("api/messenger/conversations/getByUser")
    Call<List<ConversationResponse>> getAllConversations();

    @GET("api/messenger/conversations/getGroupByUser")
    Call<List<ConversationResponse>> getAllGroups();

    @GET("api/messenger/conversations/getRecentUserChat")
    Call<List<RecentUserChatResponse>> getRecentUserChat();
}
