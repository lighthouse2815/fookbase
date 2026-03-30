package com.dang.app.dto.messenger.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class ContactRequest {

    @NotNull
    private UUID userId;
}
