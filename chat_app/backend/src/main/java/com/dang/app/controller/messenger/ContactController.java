package com.dang.app.controller.messenger;

import com.dang.app.dto.messenger.request.ContactRequest;
import com.dang.app.dto.messenger.response.ContactResponse;
import com.dang.app.service.messenger.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messenger/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/create")
    public ResponseEntity<?> createContact(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid ContactRequest request
    ) {
        UUID currentUserId = UUID.fromString(jwt.getSubject());
        contactService.createContact(currentUserId, request.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body("ok");
    }

    @GetMapping("/getByUser")
    public ResponseEntity<List<ContactResponse>> getAllContacts(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                contactService.getAllContacts(userId)
        );
    }
}
