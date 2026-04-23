package com.dangngulon.frontend.feature.profile.data.di;

import com.dangngulon.frontend.feature.profile.data.remote.api.UserProfileApi;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import retrofit2.Retrofit;

@Module
@InstallIn(SingletonComponent.class)
public final class ProfileNetworkModule {

    private ProfileNetworkModule() {
    }

    @Provides
    @Singleton
    static UserProfileApi provideUserProfileApi(Retrofit retrofit) {
        return retrofit.create(UserProfileApi.class);
    }
}
