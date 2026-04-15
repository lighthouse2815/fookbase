package com.dang.app.dto.admin.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminUserStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long bannedUsers;
    private long inactiveUsers;
    private List<AdminMonthlyCountResponse> monthlyCreatedUsers;
}

