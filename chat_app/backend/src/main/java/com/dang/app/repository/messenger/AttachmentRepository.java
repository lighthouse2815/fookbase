package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByMessage_IdInAndDeletedAtIsNullOrderByCreatedAtAsc(List<UUID> messageIds);
}
