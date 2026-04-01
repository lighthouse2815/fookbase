package com.dang.app.repository.projection.messenger;

public interface FriendSuggestionProjection {
    byte[] getId();

    String getDisplayName();

    String getAvatarUrl();

    Long getMutualFriends();
}
