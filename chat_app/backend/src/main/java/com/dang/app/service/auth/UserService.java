package com.dang.app.service.auth;

import com.dang.app.dto.auth.response.UserBasicResponse;
import com.dang.app.utils.enums.AuthProvider;
import com.dang.app.utils.enums.Status;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.entity.auth.User;
import com.dang.app.repository.auth.UserRepository;
import com.dang.app.utils.mapper.UserMapper;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Validated
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    /*
    * Hàm tạo User
    * 1. Kiểm tra username tồn tại
    * 2. Password đã được mã hóa bên AuthService.register()
    * 3. Thêm phương thức đăng nhập
    * */
    public User createUser(
            String username,
            String password,
            Set<AuthProvider> authProviders
    ) {
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(ErrorCode.USERNAME_EXISTS);
        }

        User user = User.builder()
                .username(username)
                .password(password)
                .build();

        if (authProviders == null || authProviders.isEmpty()) {
            user.getAuthProviders().add(AuthProvider.LOCAL);
        } else {
            user.getAuthProviders().addAll(authProviders);
        }

        return userRepository.save(user);
    }


    /*
    * Hàm chỉnh sửa User
    * */
    public void updateUser(User user) {
        // TODO:
    }


    /*
    * Hàm xóa User
    * */
    public void deleteUser(User user) {
        // TODO:
    }


    @Transactional
    public void setActiveUser(@NotNull User user) {
        if (!user.getStatus().equals(Status.ACTIVE)) {
            user.setStatus(Status.ACTIVE);
        }
    }


    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->  new BusinessException(ErrorCode.INVALID_CREDENTIALS));
    }

    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public UserBasicResponse getBasicUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Public user lookup failed: userId={} not found", userId);
                    return new BusinessException(ErrorCode.USER_NOT_FOUND);
                });

        if (user.getDeletedAt() != null) {
            log.warn("Public user lookup failed: userId={} was deleted", userId);
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        return userMapper.toUserBasicResponse(user);
    }

    public void save(User user){
        userRepository.save(user);
    }

    public boolean isUsernameTaken(String username) {
        return userRepository.existsByUsername(username);
    }

    public List<User> findAllById(Set<UUID> memberIds) {
        return userRepository.findAllById(memberIds);
    }

}

