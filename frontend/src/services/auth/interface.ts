import type { AuthResponse } from '@/interface/auth';

export interface RawAuthPayload {
  token?: string;
  accessToken?: string;
  jwt?: string;
  status?: string;
  user?: AuthResponse['user'];
  userId?: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
}
