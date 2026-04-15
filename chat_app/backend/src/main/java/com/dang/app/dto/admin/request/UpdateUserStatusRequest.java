package com.dang.app.dto.admin.request;

import com.dang.app.utils.enums.Status;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    @NotNull
    private Status status;
}

