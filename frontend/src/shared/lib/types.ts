export type PromptReason = 'credential_returned' | string;

export interface GoogleCredentialResponse {
  credential?: string;
}

export interface PromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => PromptReason;
}

export interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (listener?: (notification: PromptMomentNotification) => void) => void;
  disableAutoSelect: () => void;
}

export interface GoogleAccounts {
  id: GoogleAccountsId;
}

export interface GoogleWindow {
  accounts: GoogleAccounts;
}

export interface CreateAuthenticatedHubConnectionInput {
  hubPath: string;
  reconnectDelaysMs: number[];
}

