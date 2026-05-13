import type { TFunction } from 'i18next';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { ChatMessage } from '@/features/message/types/contracts';
import type { ConversationListItem } from '@/features/message/types/hooks';
import type { ChatFilterTab } from '@/features/message/types/pages';
import type { User } from '@/features/user/types/contracts';

export interface MessagesSidebarProps {
  t: TFunction;
  showConversationList: boolean;
  activeTab: ChatFilterTab;
  setActiveTab: Dispatch<SetStateAction<ChatFilterTab>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  errorMessage: string | null;
  chatTabs: Array<{ id: ChatFilterTab; label: string }>;
  tabCount: (tab: ChatFilterTab) => number;
  filteredConversations: ConversationListItem[];
  selectedConversationId: string | null;
  setSelectedConversationId: Dispatch<SetStateAction<string | null>>;
  onOpenCreateGroup: () => void;
}

export interface MessagesConversationDetailProps {
  t: TFunction;
  showConversationDetail: boolean;
  selectedConversation: ConversationListItem | null;
  selectedMessages: ChatMessage[];
  loadingConversationId: string | null;
  messageError: string | null;
  currentUserId: string;
  currentUserAvatarUrl: string;
  knownUsers: User[];
  composerValue: string;
  setComposerValue: Dispatch<SetStateAction<string>>;
  isSending: boolean;
  isRealtimeConnected: boolean;
  isMobileViewport: boolean;
  messagesViewportRef: RefObject<HTMLDivElement>;
  onBack: () => void;
  onSendMessage: () => Promise<void>;
}

export interface MessagesCreateGroupDialogProps {
  t: TFunction;
  isOpen: boolean;
  groupName: string;
  setGroupName: Dispatch<SetStateAction<string>>;
  selectedMemberIds: string[];
  groupError: string | null;
  isCreatingGroup: boolean;
  friendCandidates: User[];
  onClose: () => void;
  onToggleMember: (userId: string) => void;
  onCreateGroup: () => Promise<void>;
}

