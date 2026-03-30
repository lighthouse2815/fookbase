package com.dang.app.entity.messenger;

import com.dang.app.entity.auth.User;
import com.dang.app.utils.enums.MemberRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "conversation_members",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"conversation_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_cm_conversation", columnList = "conversation_id"),
                @Index(name = "idx_cm_user", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMember {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, updatable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role;

    @Column(name = "last_read_message_id")
    private UUID lastReadMessageId;

    @Column(name = "member_role")
    private MemberRole memberRole;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false,nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

}

