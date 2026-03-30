package com.dangngulon.frontend.di;

import android.content.Context;

import com.dangngulon.frontend.utils.data.AuthManager;

import javax.inject.Singleton;

import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.android.qualifiers.ApplicationContext;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public class StorageModule {

    @Provides
    @Singleton
    public AuthManager provideAuthManager(@ApplicationContext Context context) {
        return new AuthManager(context);
    }

}
