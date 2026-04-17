import type { TFunction } from 'i18next';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { ChatMessage, ConversationSummary } from '@/interface/message';
import type { User } from '@/interface/user';

import type { ChatFilterTab, FetchState } from './type';

export interface ConversationListItem extends ConversationSummary {
  displayAvatar: string;
  isOnline: boolean;
}

export interface UseMessagesPageReturn {
  t: TFunction;
  currentUser: User;
  fetchState: FetchState;
  activeTab: ChatFilterTab;
  setActiveTab: Dispatch<SetStateAction<ChatFilterTab>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  errorMessage: string | null;
  chatTabs: Array<{ id: ChatFilterTab; label: string }>;
  filteredConversations: ConversationListItem[];
  selectedConversationId: string | null;
  setSelectedConversationId: Dispatch<SetStateAction<string | null>>;
  selectedConversation: ConversationListItem | null;
  selectedMessages: ChatMessage[];
  loadingConversationId: string | null;
  messageError: string | null;
  composerValue: string;
  setComposerValue: Dispatch<SetStateAction<string>>;
  isSending: boolean;
  isRealtimeConnected: boolean;
  isCreateGroupOpen: boolean;
  setIsCreateGroupOpen: Dispatch<SetStateAction<boolean>>;
  groupName: string;
  setGroupName: Dispatch<SetStateAction<string>>;
  selectedMemberIds: string[];
  groupError: string | null;
  isCreatingGroup: boolean;
  friendCandidates: User[];
  messagesViewportRef: RefObject<HTMLDivElement | null>;
  handleSendMessage: () => Promise<void>;
  closeGroupDialog: () => void;
  handleToggleMember: (userId: string) => void;
  handleCreateGroup: () => Promise<void>;
  tabCount: (tab: ChatFilterTab) => number;
}
