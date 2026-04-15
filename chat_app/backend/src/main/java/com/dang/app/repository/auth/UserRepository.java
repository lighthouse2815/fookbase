package com.dang.app.repository.auth;

import com.dang.app.entity.auth.User;
import com.dang.app.utils.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, UUID id);

    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(Status status);

    List<User> findByDeletedAtIsNullAndCreatedAtAfter(LocalDateTime createdAt);

}
