package com.dang.app.entity.messenger;

import com.dang.app.entity.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "contacts",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"owner_id", "target_id"})
        },
        indexes = {
                @Index(name = "idx_contact_owner", columnList = "owner_id"),
                @Index(name = "idx_contact_target", columnList = "target_id")
        }
)

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, updatable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_id", nullable = false, updatable = false)
    private User target;

    @Column(length = 100)
    private String nickname;

    @Column(nullable = false)
    private boolean phoneVisible = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean blocked = false;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}


