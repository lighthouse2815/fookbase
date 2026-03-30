package com.dang.app.entity.auth;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_token_user_id", columnList = "user_id"),
                @Index(name = "idx_refresh_token_family_id", columnList = "family_id"),
                @Index(name = "idx_refresh_token_expires_at", columnList = "expires_at"),
                @Index(name = "idx_refresh_token_revoked_at", columnList = "revoked_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @Column(columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "family_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID familyId;

    @Column(nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "replaced_by_token_id", columnDefinition = "BINARY(16)")
    private UUID replacedByTokenId;

    @Column(name = "revoked_reason", length = 64)
    private String revokedReason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Long version;
}
