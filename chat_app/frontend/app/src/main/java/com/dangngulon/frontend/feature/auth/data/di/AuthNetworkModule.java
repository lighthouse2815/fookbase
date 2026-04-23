package com.dangngulon.frontend.feature.auth.data.di;

import com.dangngulon.frontend.feature.auth.data.remote.api.AuthApi;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import retrofit2.Retrofit;

@Module
@InstallIn(SingletonComponent.class)
public final class AuthNetworkModule {

    private AuthNetworkModule() {
    }

    @Provides
    @Singleton
    static AuthApi provideAuthApi(Retrofit retrofit) {
        return retrofit.create(AuthApi.class);
    }
}
