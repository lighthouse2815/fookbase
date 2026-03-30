package com.dangngulon.frontend.ui.common.helpers;

import android.annotation.SuppressLint;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
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
            return minutes + " phút";
        }

        if (hours < 24) {
            return hours + " giờ";
        }

        if (days < 3) {
            return days + " ngày";
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

            // format đẹp hơn
            java.time.ZoneId zone = java.time.ZoneId.systemDefault();
            java.time.LocalDateTime dateTime = instant.atZone(zone).toLocalDateTime();

            return dateTime.getHour() + ":" + String.format("%02d", dateTime.getMinute());
        } catch (Exception e) {
            return timestamp; // fallback nếu parse fail
        }
    }

    public static String formatDate(String isoDate) {
        // parse ISO string
        LocalDateTime dateTime = LocalDateTime.parse(isoDate);

        // format thành dd/MM/yyyy
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        return dateTime.format(formatter);
    }
}
