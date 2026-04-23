package com.dangngulon.frontend.core.common.ui.helpers;

import org.junit.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static org.junit.Assert.assertEquals;

public class TimeFormatterTest {

    @Test
    public void formatConversationTimestamp_withRecentTimestamp_returnsHourMinute() {
        Instant instant = Instant.now().minus(Duration.ofHours(2));
        String timestamp = instant.toString();
        String expected = LocalDateTime.ofInstant(instant, ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("HH:mm"));

        assertEquals(expected, TimeFormatter.formatConversationTimestamp(timestamp));
    }

    @Test
    public void formatConversationTimestamp_withOldTimestamp_returnsDayMonth() {
        Instant instant = Instant.now().minus(Duration.ofHours(30));
        String timestamp = instant.toString();
        String expected = LocalDateTime.ofInstant(instant, ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("d 'thg' M"));

        assertEquals(expected, TimeFormatter.formatConversationTimestamp(timestamp));
    }

    @Test
    public void formatConversationTimestamp_withInvalidTimestamp_returnsOriginalValue() {
        String timestamp = "invalid-time-value";

        assertEquals(timestamp, TimeFormatter.formatConversationTimestamp(timestamp));
    }
}
