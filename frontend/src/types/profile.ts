import type { User } from './user';

export interface Profile extends User {
  bio?: string;
  coverUrl?: string;
  major?: string;
  year?: string;
  friendsCount: number;
  postsCount: number;
}

