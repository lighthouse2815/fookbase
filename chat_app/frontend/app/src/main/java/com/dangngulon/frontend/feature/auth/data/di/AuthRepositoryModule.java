package com.dangngulon.frontend.feature.auth.data.di;

import com.dangngulon.frontend.core.session.domain.repository.ISessionRepository;
import com.dangngulon.frontend.feature.auth.data.repository.AuthRepository;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;

import javax.inject.Singleton;

import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public abstract class AuthRepositoryModule {

    @Binds
    @Singleton
    public abstract IAuthRepository bindAuthRepository(AuthRepository impl);

    @Binds
    @Singleton
    public abstract ISessionRepository bindSessionRepository(AuthRepository impl);
}
