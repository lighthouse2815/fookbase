package com.dang.app.entity.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "user_profile_info_visibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileInfoVisibility {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "display_name_visible")
    private Boolean displayNameVisible = true;

    @Builder.Default
    @Column(name = "phone_visible")
    private Boolean phoneVisible = true;

    @Builder.Default
    @Column(name = "email_visible")
    private Boolean emailVisible = true;

    @Builder.Default
    @Column(name = "date_of_birth_visible")
    private Boolean dateOfBirthVisible = true;

    @Builder.Default
    @Column(name = "gender_visible")
    private Boolean genderVisible = true;

    @Builder.Default
    @Column(name = "friend_count_visible")
    private Boolean friendCountVisible = true;

    @PrePersist
    public void applyDefaults() {
        if (displayNameVisible == null) displayNameVisible = true;
        if (phoneVisible == null) phoneVisible = true;
        if (emailVisible == null) emailVisible = true;
        if (dateOfBirthVisible == null) dateOfBirthVisible = true;
        if (genderVisible == null) genderVisible = true;
        if (friendCountVisible == null) friendCountVisible = true;
    }
}
