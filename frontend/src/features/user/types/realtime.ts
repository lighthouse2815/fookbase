export interface PresenceChangedEventPayload {
  userId: string;
  isOnline: boolean;
  lastSeenAtUtc?: string | null;
  observedAtUtc?: string | null;
}

export interface PresenceRealtimeHandlers {
  onPresenceChanged: (payload: PresenceChangedEventPayload) => void;
}

