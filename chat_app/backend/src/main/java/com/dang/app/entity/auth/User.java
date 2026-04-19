package com.dang.app.entity.auth;

import com.dang.app.utils.enums.AuthProvider;
import com.dang.app.utils.enums.Role;
import com.dang.app.utils.enums.Status;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "users",
        indexes = @Index(name = "idx_user_username", columnList = "username")
)
@Builder
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)",updatable = false, nullable = false)
    private UUID id;

    @Column(unique = true,length = 50)
    private String username;

    @Column(length = 255)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.INACTIVE;

    @Column(name = "status_before_ban")
    @Enumerated(EnumType.STRING)
    private Status statusBeforeBan;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_auth_providers",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "provider")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<AuthProvider> authProviders = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false,nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

}
