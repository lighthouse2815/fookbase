package com.dang.app.dto.admin.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminMonthlyCountResponse {
    private String month;
    private long count;
}

