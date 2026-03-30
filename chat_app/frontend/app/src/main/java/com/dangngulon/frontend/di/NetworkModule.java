package com.dangngulon.frontend.di;

import android.content.Context;

//import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.api.auth.AuthApi;
import com.dangngulon.frontend.api.auth.UserProfileApi;
import com.dangngulon.frontend.api.zola.ContactApi;
import com.dangngulon.frontend.api.zola.ConversationApi;
import com.dangngulon.frontend.api.zola.FriendShipApi;
import com.dangngulon.frontend.api.zola.MessageApi;
import com.dangngulon.frontend.utils.network.ApiErrorMapper;
import com.dangngulon.frontend.utils.network.AuthInterceptor;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
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
    OkHttpClient provideOkHttpClient(@ApplicationContext Context context) {
        return new OkHttpClient.Builder()
                .addInterceptor(new AuthInterceptor(context))
                .build();
    }

    @Provides
    @Singleton
    Retrofit provideRetrofit(OkHttpClient client, Gson gson) {
        return new Retrofit.Builder()
                .baseUrl("http://192.168.1.47:8080/")
//                .baseUrl(BuildConfig.BASE_URL)
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
    FriendShipApi provideFriendShipApi(Retrofit retrofit) {
        return retrofit.create(FriendShipApi.class);
    }


}
