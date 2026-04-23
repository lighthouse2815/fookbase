package com.dangngulon.frontend.core.di;

import com.dangngulon.frontend.core.utils.data.AuthManager;
import com.dangngulon.frontend.core.network.socket.SocketManager;
import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

import javax.inject.Singleton;

@Module
@InstallIn(SingletonComponent.class)
public abstract class SocketModule {

    @Provides
    @Singleton
    static SocketManager provideSocketManager(AuthManager authManager) {
        return new SocketManager(authManager);
    }
}
