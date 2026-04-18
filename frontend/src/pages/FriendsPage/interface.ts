export interface FriendSearchStatusMeta {
  label: string;
  action: 'send' | 'cancel' | 'respond' | 'none';
  buttonLabel: string;
  buttonClassName: string;
  badgeClassName: string;
}
