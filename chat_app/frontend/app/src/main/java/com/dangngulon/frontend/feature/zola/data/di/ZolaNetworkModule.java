package com.dangngulon.frontend.feature.zola.data.di;

import com.dangngulon.frontend.feature.zola.data.remote.api.AddFriendProfileApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.ContactApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.ConversationApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.FriendshipApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.MessageApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.UploadApi;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import retrofit2.Retrofit;

@Module
@InstallIn(SingletonComponent.class)
public final class ZolaNetworkModule {

    private ZolaNetworkModule() {
    }

    @Provides
    @Singleton
    static AddFriendProfileApi provideAddFriendProfileApi(Retrofit retrofit) {
        return retrofit.create(AddFriendProfileApi.class);
    }

    @Provides
    @Singleton
    static ContactApi provideContactApi(Retrofit retrofit) {
        return retrofit.create(ContactApi.class);
    }

    @Provides
    @Singleton
    static ConversationApi provideConversationApi(Retrofit retrofit) {
        return retrofit.create(ConversationApi.class);
    }

    @Provides
    @Singleton
    static MessageApi provideMessageApi(Retrofit retrofit) {
        return retrofit.create(MessageApi.class);
    }

    @Provides
    @Singleton
    static FriendshipApi provideFriendshipApi(Retrofit retrofit) {
        return retrofit.create(FriendshipApi.class);
    }

    @Provides
    @Singleton
    static UploadApi provideUploadApi(Retrofit retrofit) {
        return retrofit.create(UploadApi.class);
    }
}
