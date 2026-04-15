package com.dang.app.utils.mapper;

import com.dang.app.dto.admin.response.AdminMonthlyCountResponse;
import com.dang.app.dto.admin.response.AdminUserSearchResponse;
import com.dang.app.dto.admin.response.AdminUserStatsResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
public class AdminMapper {
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM", Locale.ROOT);

    public AdminUserSearchResponse toAdminUserSearchResponse(UserProfile profile) {
        return toAdminUserSearchResponse(profile.getUser(), profile);
    }

    public AdminUserSearchResponse toAdminUserSearchResponse(User user, UserProfile profile) {
        String avatarUrl = profile == null || profile.getAvatarUrl() == null || profile.getAvatarUrl().isBlank()
                ? null
                : profile.getAvatarUrl().trim();

        String displayName = null;
        if (profile != null && profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            displayName = profile.getDisplayName().trim();
        }
        if (displayName == null && user.getUsername() != null && !user.getUsername().isBlank()) {
            displayName = user.getUsername().trim();
        }
        if (displayName == null) {
            displayName = "user";
        }

        return AdminUserSearchResponse.builder()
                .userId(user.getId())
                .username(normalize(user.getUsername()))
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .email(profile == null ? null : normalize(profile.getEmail()))
                .phoneNumber(profile == null ? null : normalize(profile.getPhoneNumber()))
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public AdminMonthlyCountResponse toAdminMonthlyCountResponse(YearMonth month, long count) {
        return AdminMonthlyCountResponse.builder()
                .month(month.format(MONTH_FORMATTER))
                .count(count)
                .build();
    }

    public AdminUserStatsResponse toAdminUserStatsResponse(
            long totalUsers,
            long activeUsers,
            long bannedUsers,
            long inactiveUsers,
            List<AdminMonthlyCountResponse> monthlyCreatedUsers
    ) {
        return AdminUserStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .bannedUsers(bannedUsers)
                .inactiveUsers(inactiveUsers)
                .monthlyCreatedUsers(monthlyCreatedUsers)
                .build();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
