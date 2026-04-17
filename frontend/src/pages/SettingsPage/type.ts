export type SettingsTabId =
  | 'security'
  | 'personal-info'
  | 'profile-page-info'
  | 'reports'
  | 'blocked';

export type SecurityPasswordStep = 'sendOtp' | 'verifyOtp' | 'resetPassword';

export type SecurityFieldKey = 'username' | 'phoneNumber';

export type SecurityEditStep = 'verifyOtp' | 'edit';
