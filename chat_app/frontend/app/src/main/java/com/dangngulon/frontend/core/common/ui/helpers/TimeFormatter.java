package com.dangngulon.frontend.core.common.ui.helpers;

import android.annotation.SuppressLint;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class TimeFormatter {
    private static final DateTimeFormatter HEADER_TIME_FORMAT =
            DateTimeFormatter.ofPattern("H : mm");
    private static final DateTimeFormatter HEADER_DATE_FORMAT =
            DateTimeFormatter.ofPattern("d 'thg' M");
    private static final DateTimeFormatter HEADER_DATE_YEAR_FORMAT =
            DateTimeFormatter.ofPattern("d 'thg' M, yyyy");

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

        LocalDateTime dateTime = parseToLocalDateTimeOrNull(timestamp.trim());
        if (dateTime == null) {
            return timestamp;
        }

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        if (!dateTime.isBefore(threshold)) {
            return dateTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        return dateTime.format(DateTimeFormatter.ofPattern("d 'thg' M"));
    }

    public static String formatChatDayHeader(String timestamp) {
        if (timestamp == null || timestamp.trim().isEmpty()) {
            return "";
        }

        LocalDateTime dateTime = parseToLocalDateTimeOrNull(timestamp.trim());
        if (dateTime == null) {
            return timestamp;
        }

        LocalDate today = LocalDate.now();
        LocalDate messageDate = dateTime.toLocalDate();
        String timePart = dateTime.format(HEADER_TIME_FORMAT);

        if (messageDate.equals(today.minusDays(1))) {
            return "Hôm qua lúc " + timePart;
        }

        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);
        if (!dateTime.isAfter(oneYearAgo)) {
            return dateTime.format(HEADER_DATE_YEAR_FORMAT) + " lúc " + timePart;
        }

        return dateTime.format(HEADER_DATE_FORMAT) + " lúc " + timePart;
    }

    public static boolean isSameLocalDate(String firstTimestamp, String secondTimestamp) {
        LocalDateTime first = parseToLocalDateTimeOrNull(firstTimestamp);
        LocalDateTime second = parseToLocalDateTimeOrNull(secondTimestamp);
        if (first == null || second == null) {
            return false;
        }

        return first.toLocalDate().equals(second.toLocalDate());
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

    public static LocalDateTime parseToLocalDateTimeOrNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        ZoneId zoneId = ZoneId.systemDefault();
        String normalized = value.trim();

        try {
            Instant instant = Instant.parse(normalized);
            return instant.atZone(zoneId).toLocalDateTime();
        } catch (Exception ignored) {
            // fallback below
        }

        try {
            return OffsetDateTime.parse(normalized)
                    .atZoneSameInstant(zoneId)
                    .toLocalDateTime();
        } catch (Exception ignored) {
            // fallback below
        }

        try {
            LocalDateTime dateTime = LocalDateTime.parse(normalized);
            return dateTime
                    .atOffset(ZoneOffset.UTC)
                    .atZoneSameInstant(zoneId)
                    .toLocalDateTime();
        } catch (Exception ignored) {
            return null;
        }
    }
}
