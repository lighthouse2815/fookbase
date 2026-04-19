package com.dangngulon.frontend.core.di;

import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.feature.auth.data.remote.api.AuthApi;
import com.dangngulon.frontend.feature.profile.data.remote.api.UserProfileApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.AddFriendProfileApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.ContactApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.ConversationApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.FriendshipApi;
import com.dangngulon.frontend.feature.zola.data.remote.api.MessageApi;
import com.dangngulon.frontend.core.network.mapper.ApiErrorMapper;
import com.dangngulon.frontend.core.network.interceptor.AuthInterceptor;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

@Module
@InstallIn(SingletonComponent.class)
public class NetworkModule {

    @Provides
    @Singleton
    Gson provideGson() {
        return new GsonBuilder()
                // Nếu sau này cần date format / naming policy thì cấu hình ở đây
                .create();
    }

    @Provides
    @Singleton
    ApiErrorMapper provideApiErrorMapper(Gson gson) {
        return new ApiErrorMapper(gson);
    }

    @Provides
    @Singleton
    OkHttpClient provideOkHttpClient(AuthInterceptor authInterceptor) {
        return new OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .build();
    }

    @Provides
    @Singleton
    Retrofit provideRetrofit(OkHttpClient client, Gson gson) {
        return new Retrofit.Builder()
                .baseUrl(BuildConfig.BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();
    }


    @Provides
    @Singleton
    AuthApi provideAuthApi(Retrofit retrofit) {
        return retrofit.create(AuthApi.class);
    }

    @Provides
    @Singleton
    UserProfileApi provideUserProfileApi(Retrofit retrofit) {
        return retrofit.create(UserProfileApi.class);
    }

    @Provides
    @Singleton
    AddFriendProfileApi provideAddFriendProfileApi(Retrofit retrofit) {
        return retrofit.create(AddFriendProfileApi.class);
    }

    @Provides
    @Singleton
    ContactApi provideContactApi(Retrofit retrofit) {
        return retrofit.create(ContactApi.class);
    }

    @Provides
    @Singleton
    ConversationApi provideConversationApi(Retrofit retrofit) {
        return retrofit.create(ConversationApi.class);
    }

    @Provides
    @Singleton
    MessageApi provideMessageApi(Retrofit retrofit) {
        return retrofit.create(MessageApi.class);
    }

    @Provides
    @Singleton
    FriendshipApi provideFriendshipApi(Retrofit retrofit) {
        return retrofit.create(FriendshipApi.class);
    }


}
