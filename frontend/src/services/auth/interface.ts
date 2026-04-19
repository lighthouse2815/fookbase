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
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  profileCompleted?: boolean;
  isNew?: boolean;
}
