package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UserProfileSummaryBatchRequest {
    @NotEmpty
    private List<@NotNull UUID> userIds;
}
