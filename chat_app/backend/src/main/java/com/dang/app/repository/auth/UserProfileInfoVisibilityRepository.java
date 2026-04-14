package com.dang.app.repository.auth;

import com.dang.app.entity.auth.UserProfileInfoVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileInfoVisibilityRepository extends JpaRepository<UserProfileInfoVisibility, UUID> {
    Optional<UserProfileInfoVisibility> findByUser_Id(UUID userId);
}
