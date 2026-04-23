package com.dangngulon.frontend.core.common.ui.helpers;

import android.annotation.SuppressLint;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class TimeFormatter {

    private TimeFormatter() {}

    public static String formatLastChatTime(LocalDateTime lastChatTime) {
        if (lastChatTime == null) return "";

        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(lastChatTime, now);

        long minutes = duration.toMinutes();
        long hours = duration.toHours();
        long days = duration.toDays();

        if (minutes < 60) {
            return minutes + " phut";
        }

        if (hours < 24) {
            return hours + " gio";
        }

        if (days < 3) {
            return days + " ngay";
        }

        if (days < 365) {
            return lastChatTime.format(DateTimeFormatter.ofPattern("dd/MM"));
        }

        return lastChatTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    @SuppressLint("DefaultLocale")
    public static String formatTimestamp(String timestamp) {
        if (timestamp == null || timestamp.isEmpty()) return "";

        try {
            Instant instant = Instant.parse(timestamp);
            LocalDateTime dateTime = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
            return dateTime.getHour() + ":" + String.format("%02d", dateTime.getMinute());
        } catch (Exception e) {
            return timestamp;
        }
    }

    public static String formatConversationTimestamp(String timestamp) {
        if (timestamp == null || timestamp.trim().isEmpty()) {
            return "";
        }

        LocalDateTime dateTime = parseToLocalDateTime(timestamp.trim());
        if (dateTime == null) {
            return timestamp;
        }

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        if (!dateTime.isBefore(threshold)) {
            return dateTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        return dateTime.format(DateTimeFormatter.ofPattern("d 'thg' M"));
    }

    public static String formatDate(String isoDate) {
        if (isoDate == null || isoDate.trim().isEmpty()) {
            return "";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        try {
            Instant instant = Instant.parse(isoDate);
            return instant
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                    .format(formatter);
        } catch (Exception ignored) {
            // fallback to local datetime parsing
        }

        try {
            LocalDateTime dateTime = LocalDateTime.parse(isoDate);
            return dateTime
                    .toLocalDate()
                    .format(formatter);
        } catch (Exception ignored) {
            return isoDate;
        }
    }

    private static LocalDateTime parseToLocalDateTime(String value) {
        ZoneId zoneId = ZoneId.systemDefault();

        try {
            Instant instant = Instant.parse(value);
            return instant.atZone(zoneId).toLocalDateTime();
        } catch (Exception ignored) {
            // fallback below
        }

        try {
            return OffsetDateTime.parse(value)
                    .atZoneSameInstant(zoneId)
                    .toLocalDateTime();
        } catch (Exception ignored) {
            // fallback below
        }

        try {
            return LocalDateTime.parse(value);
        } catch (Exception ignored) {
            return null;
        }
    }
}
