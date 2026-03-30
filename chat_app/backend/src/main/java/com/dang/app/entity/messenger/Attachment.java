package com.dang.app.entity.messenger;

import com.dang.app.utils.enums.AttachmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "attachments",
        indexes = @Index(name = "idx_attachment_message", columnList = "message_id")
)
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false, updatable = false)
    private Message message;

    @Column(nullable = false, length = 1000)
    private String fileUrl;

    @Column(length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType fileType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false, length = 100)
    private String contentType;

    @CreationTimestamp
    @Column(updatable = false,nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

}

