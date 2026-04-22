import { useState } from 'react';
import type { TFunction } from 'i18next';

import { messageService } from '@/features/message/api/service/messageService';
import type { ChatFilterTab } from '@/features/message/types/pages';

interface UseMessagesGroupCreationParams {
  t: TFunction;
  currentUserId: string;
  setActiveTab: (tab: ChatFilterTab) => void;
  loadConversations: (options?: { silent?: boolean }) => Promise<unknown>;
}

export const useMessagesGroupCreation = ({
  t,
  currentUserId,
  setActiveTab,
  loadConversations,
}: UseMessagesGroupCreationParams) => {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const closeGroupDialog = () => {
    if (isCreatingGroup) {
      return;
    }

    setIsCreateGroupOpen(false);
    setGroupName('');
    setSelectedMemberIds([]);
    setGroupError(null);
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((existing) =>
      existing.includes(userId) ? existing.filter((memberId) => memberId !== userId) : [...existing, userId],
    );
  };

  const handleCreateGroup = async () => {
    const trimmedGroupName = groupName.trim();

    if (trimmedGroupName.length === 0) {
      setGroupError(t('messagesPage.errors.groupNameRequired'));
      return;
    }

    if (selectedMemberIds.length === 0) {
      setGroupError(t('messagesPage.errors.groupMemberRequired'));
      return;
    }

    setIsCreatingGroup(true);
    setGroupError(null);

    try {
      await messageService.createGroupConversation({
        currentUserId,
        name: trimmedGroupName,
        memberIds: selectedMemberIds,
      });

      setIsCreateGroupOpen(false);
      setGroupName('');
      setSelectedMemberIds([]);
      setGroupError(null);
      setActiveTab('groups');
      await loadConversations({ silent: true });
    } catch {
      setGroupError(t('messagesPage.errors.createGroup'));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return {
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    groupName,
    setGroupName,
    selectedMemberIds,
    groupError,
    isCreatingGroup,
    closeGroupDialog,
    handleToggleMember,
    handleCreateGroup,
  };
};

export type UseMessagesGroupCreationReturn = ReturnType<typeof useMessagesGroupCreation>;
