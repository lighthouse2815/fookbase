package com.dangngulon.frontend.domain.usecase.zola;

import android.graphics.Bitmap;
import android.net.Uri;

import com.dangngulon.frontend.domain.common.AppResult;
import com.dangngulon.frontend.model.zola.request.FriendshipRequest;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.repository.zola.FriendshipRepository;
import com.dangngulon.frontend.utils.qr.QrUtils;

import java.util.concurrent.CompletableFuture;

import javax.inject.Inject;

public class AddFriendUseCase {
    private final FriendshipRepository friendShipRepository;

    @Inject
    public AddFriendUseCase(FriendshipRepository friendShipRepository){
        this.friendShipRepository = friendShipRepository;
    }

    public String parseQrUserId(String content){
        if(content == null || !content.startsWith("chat_app://user/")){
            return null;
        }

        Uri uri = Uri.parse(content);

        // NOTE: expected format chat_app://user/{userId}
        if(!"chat_app".equals(uri.getScheme()) || !"user".equals(uri.getHost())){
            return null;
        }

        return uri.getLastPathSegment();
    }

    public Bitmap generateQrBitmap(String userId, int size) {
        String qrContent = "chat_app://user/" + userId;
        return QrUtils.generateQr(qrContent, size);
    }

    public CompletableFuture<AppResult<FriendshipResponse>> sendFriendRequest(String userId) {
        return friendShipRepository.sendFriendRequest(
                new FriendshipRequest(userId)
        );
    }
}
