package com.dang.app.repository.auth;

import com.dang.app.entity.auth.OTP;
import com.dang.app.entity.auth.User;
import com.dang.app.utils.enums.OTPType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OTPRepository extends JpaRepository<OTP, UUID> {

    void deleteByUserAndType(User user, OTPType type);

    Optional<OTP> findTopByUserAndTypeOrderByCreatedAtDesc(User user, OTPType type);

    Optional<OTP> findByUser_idAndType(UUID id, OTPType type);

}

