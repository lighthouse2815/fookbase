package com.dang.app.repository.auth;

import com.dang.app.entity.auth.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface TokenRepository extends JpaRepository<RefreshToken, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT rt
            FROM RefreshToken rt
            JOIN FETCH rt.user u
            WHERE rt.id = :tokenId
            """)
    Optional<RefreshToken> findByIdForUpdate(@Param("tokenId") UUID tokenId);

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
            SET rt.revokedAt = :revokedAt,
                rt.revokedReason = :reason
            WHERE rt.familyId = :familyId
              AND rt.revokedAt IS NULL
            """)
    int revokeActiveByFamilyId(
            @Param("familyId") UUID familyId,
            @Param("revokedAt") LocalDateTime revokedAt,
            @Param("reason") String reason
    );
}
