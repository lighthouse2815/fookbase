package com.dang.app.entity.messenger;

import com.dang.app.entity.auth.User;
import com.dang.app.utils.enums.FriendshipStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "friendships",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_low_id", "user_high_id"})
        },
        indexes = {
                @Index(name = "idx_friendship_requester", columnList = "requester_id"),
                @Index(name = "idx_friendship_addressee", columnList = "addressee_id"),
                @Index(name = "idx_friendship_status", columnList = "status"),
                @Index(name = "idx_friendship_user_low", columnList = "user_low_id"),
                @Index(name = "idx_friendship_user_high", columnList = "user_high_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_low_id", nullable = false, updatable = false)
    private UUID userLowId;

    @Column(name = "user_high_id", nullable = false, updatable = false)
    private UUID userHighId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}

