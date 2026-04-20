import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { MyProfileSettings } from '@/interface/profile';
import type { PostReportItem, StoryReportItem, UserReportItem } from '@/interface/report';

import type {
  SecurityEditStep,
  SecurityFieldKey,
  SecurityPasswordStep,
  SettingsTabId,
} from './type';

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
}

export interface UseSettingsPageReturn {
  t: TFunction;
  searchKeyword: string;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
  filteredTabs: SettingsTab[];
  activeTab: SettingsTabId;
  handleSelectTab: (tabId: SettingsTabId) => void;
  activeTabConfig: SettingsTab | undefined;
  hasFilteredTabs: boolean;
}

export interface PersonalInfoFormState {
  displayName: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
  avatarUrl: string;
}

export interface SettingsCornerToastSnapshot {
  message: string;
  type: 'success' | 'error';
}

export interface UsePersonalInfoSettingsReturn {
  t: TFunction;
  profile: MyProfileSettings | null;
  form: PersonalInfoFormState;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  errorMessage: string | null;
  avatarInputRef: RefObject<HTMLInputElement>;
  toast: SettingsCornerToastSnapshot | null;
  handleFieldChange: (field: keyof PersonalInfoFormState, value: string) => void;
  openAvatarPicker: () => void;
  handleAvatarFileChange: (file: File | null) => void;
  handleSave: () => Promise<void>;
  avatarSource: string;
}

export interface UseReportedPostsPageReturn {
  t: TFunction;
  activeTab: ReportedPostsTabId;
  setActiveTab: (tab: ReportedPostsTabId) => void;
  reports: Array<PostReportItem | StoryReportItem | UserReportItem>;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  loadError: string | null;
  loadReports: (targetPage: number, replace?: boolean) => Promise<void>;
}

export type ReportedPostsTabId = 'post' | 'story' | 'user';

export interface UseSecuritySettingsReturn {
  t: TFunction;
  step: SecurityPasswordStep;
  otp: string;
  setOtp: Dispatch<SetStateAction<string>>;
  resetToken: string;
  newPassword: string;
  setNewPassword: Dispatch<SetStateAction<string>>;
  confirmPassword: string;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
  errorMessage: string | null;
  infoMessage: string | null;
  securityUsername: string;
  securityEmail: string | null;
  securityPhoneNumber: string | null;
  showSecurityUsername: boolean;
  setShowSecurityUsername: Dispatch<SetStateAction<boolean>>;
  showSecurityEmail: boolean;
  setShowSecurityEmail: Dispatch<SetStateAction<boolean>>;
  showSecurityPhoneNumber: boolean;
  setShowSecurityPhoneNumber: Dispatch<SetStateAction<boolean>>;
  isLoadingSecurityUsername: boolean;
  securityUsernameError: string | null;
  isSendingEditOtp: boolean;
  editingField: SecurityFieldKey | null;
  activeEditField: SecurityFieldKey | null;
  activeEditStep: SecurityEditStep | null;
  editOtp: string;
  setEditOtp: Dispatch<SetStateAction<string>>;
  editValue: string;
  setEditValue: Dispatch<SetStateAction<string>>;
  isVerifyingEditOtp: boolean;
  isUpdatingEditField: boolean;
  editOtpInfoMessage: string | null;
  editOtpErrorMessage: string | null;
  resolveSensitiveValue: (
    value: string | null,
    isVisible: boolean,
    options?: { prefix?: string },
  ) => string;
  getFieldLabel: (field: SecurityFieldKey) => string;
  resetEditFlow: () => void;
  handleSendEditOtp: (field: SecurityFieldKey) => Promise<void>;
  handleVerifyEditOtp: () => Promise<void>;
  handleUpdateEditField: () => Promise<void>;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleResetPassword: () => Promise<void>;
  handleCancelPasswordFlow: () => void;
}
