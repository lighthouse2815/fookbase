package com.dang.app.service.other;

import com.dang.app.utils.enums.OTPMailType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class MailService {

    private static final String PROVIDER_RESEND = "resend";
    private static final String RESEND_AUTH_PREFIX = "Bearer ";
    private static final String RESEND_USER_AGENT = "fookbase-java-backend/1.0";

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${email.provider:smtp}")
    private String emailProvider;

    @Value("${email.resend.api-key:}")
    private String resendApiKey;

    @Value("${email.resend.from:}")
    private String resendFrom;

    @Value("${email.resend.endpoint:https://api.resend.com/emails}")
    private String resendEndpoint;

    @Value("${email.resend.request-timeout-ms:10000}")
    private long resendRequestTimeoutMs;

    public MailService(JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /*
     * Send OTP email via configured provider (smtp|resend).
     */
    public void sendOTPEmail(String email, String otp, OTPMailType type) {
        String subject = type.subject();
        String text = """
        %s :

        %s

        Ma xac nhan co hieu luc trong 2 phut.
        Vui long khong chia se ma nay voi bat ky ai.
        """.formatted(type.title(), otp);

        if (PROVIDER_RESEND.equalsIgnoreCase(emailProvider)) {
            sendWithResend(email, subject, text);
            return;
        }

        sendWithSmtp(email, subject, text);
    }

    private void sendWithSmtp(String email, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private void sendWithResend(String email, String subject, String text) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException(
                    "Missing RESEND_API_KEY while email.provider=resend"
            );
        }

        if (resendFrom == null || resendFrom.isBlank()) {
            throw new IllegalStateException(
                    "Missing RESEND_FROM while email.provider=resend"
            );
        }

        String payload = toResendPayload(email, subject, text);

        HttpRequest request = HttpRequest.newBuilder(URI.create(resendEndpoint))
                .timeout(Duration.ofMillis(Math.max(resendRequestTimeoutMs, 1)))
                .header("Authorization", RESEND_AUTH_PREFIX + resendApiKey)
                .header("Content-Type", "application/json")
                .header("User-Agent", RESEND_USER_AGENT)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new IllegalStateException("Resend request failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Resend request interrupted", e);
        }

        int status = response.statusCode();
        if (status < 200 || status >= 300) {
            throw new IllegalStateException(
                    "Resend send email failed with status " + status + ": " + response.body()
            );
        }
    }

    private String toResendPayload(String email, String subject, String text) {
        Map<String, Object> payload = Map.of(
                "from", resendFrom,
                "to", List.of(email),
                "subject", subject,
                "text", text
        );

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to build Resend payload", e);
        }
    }
}
