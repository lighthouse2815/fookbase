package com.dang.app.service.auth;

import com.dang.app.dto.admin.response.AdminMonthlyCountResponse;
import com.dang.app.dto.admin.response.AdminUserSearchResponse;
import com.dang.app.dto.admin.response.AdminUserStatsResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.repository.auth.UserProfileRepository;
import com.dang.app.repository.auth.UserRepository;
import com.dang.app.utils.enums.Status;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.mapper.AdminMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Validated
@Service
@RequiredArgsConstructor
public class AdminService {
    private static final int SEARCH_LIMIT = 30;
    private static final int STATS_MONTHS = 6;

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AdminMapper adminMapper;

    public List<AdminUserSearchResponse> searchUsers(String keyword) {
        String normalizedKeyword = normalize(keyword);
        List<UserProfile> profiles;

        if (normalizedKeyword == null) {
            profiles = userProfileRepository.findByDeletedAtIsNullAndUser_DeletedAtIsNullOrderByUpdatedAtDesc(
                    PageRequest.of(0, SEARCH_LIMIT)
            );
        } else {
            profiles = userProfileRepository.searchForAdmin(
                    normalizedKeyword,
                    PageRequest.of(0, SEARCH_LIMIT)
            );
        }

        return profiles.stream()
                .map(adminMapper::toAdminUserSearchResponse)
                .toList();
    }

    public AdminUserSearchResponse updateUserStatus(UUID targetUserId, Status status) {
        User targetUser = userService.findById(targetUserId);

        if (targetUser.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        Status nextStatus = resolveNextStatus(targetUser, status);
        targetUser.setStatus(nextStatus);

        if (nextStatus != Status.BANNED) {
            targetUser.setStatusBeforeBan(null);
        }

        userService.save(targetUser);

        UserProfile profile = userProfileRepository.findByUser_Id(targetUserId)
                .orElse(null);

        return adminMapper.toAdminUserSearchResponse(targetUser, profile);
    }

    private Status resolveNextStatus(User targetUser, Status requestedStatus) {
        Status currentStatus = targetUser.getStatus();

        if (requestedStatus == Status.BANNED) {
            if (currentStatus != Status.BANNED) {
                targetUser.setStatusBeforeBan(currentStatus);
            }

            return Status.BANNED;
        }

        if (currentStatus == Status.BANNED && requestedStatus == Status.ACTIVE) {
            Status previousStatus = targetUser.getStatusBeforeBan();
            if (previousStatus != null && previousStatus != Status.BANNED) {
                return previousStatus;
            }
        }

        return requestedStatus;
    }

    public AdminUserStatsResponse getUserStats() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long activeUsers = userRepository.countByStatusAndDeletedAtIsNull(Status.ACTIVE);
        long bannedUsers = userRepository.countByStatusAndDeletedAtIsNull(Status.BANNED);
        long inactiveUsers = userRepository.countByStatusAndDeletedAtIsNull(Status.INACTIVE);

        LocalDateTime now = LocalDateTime.now();
        YearMonth currentMonth = YearMonth.from(now);
        YearMonth startMonth = currentMonth.minusMonths(STATS_MONTHS - 1L);
        LocalDateTime startDateTime = startMonth.atDay(1).atStartOfDay();

        List<User> recentUsers = userRepository.findByDeletedAtIsNullAndCreatedAtAfter(startDateTime);
        Map<YearMonth, Long> createdByMonth = recentUsers.stream()
                .collect(Collectors.groupingBy(
                        user -> YearMonth.from(user.getCreatedAt()),
                        Collectors.counting()
                ));

        List<AdminMonthlyCountResponse> monthlyCreatedUsers = new ArrayList<>(STATS_MONTHS);
        for (int index = 0; index < STATS_MONTHS; index++) {
            YearMonth month = startMonth.plusMonths(index);
            monthlyCreatedUsers.add(adminMapper.toAdminMonthlyCountResponse(
                    month,
                    createdByMonth.getOrDefault(month, 0L)
            ));
        }

        return adminMapper.toAdminUserStatsResponse(
                totalUsers,
                activeUsers,
                bannedUsers,
                inactiveUsers,
                monthlyCreatedUsers
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
