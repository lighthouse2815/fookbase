package com.dangngulon.frontend.api.zola;

import com.dangngulon.frontend.model.zola.request.SendMessageRequest;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;

import java.time.Instant;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface MessageApi {

    @POST("api/messenger/messages/send")
    Call<MessageResponse> sendMessage(@Body SendMessageRequest request);

    @GET("api/messenger/messages/conversation/{conversationId}")
    Call<MessageCursorPageResponse> getMessages(
            @Path("conversationId") String conversationId,
            @Query("cursorCreatedAt") Instant cursorCreatedAt,
            @Query("cursorMessageId") String cursorMessageId,
            @Query("limit") int limit
    );
}
