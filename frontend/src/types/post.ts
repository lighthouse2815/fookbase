import type { User } from './user';

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  likedByCurrentUser?: boolean;
  commentCount?: number;
  comments: Comment[];
}

export interface Story {
  id: string;
  author: User;
  imageUrl: string;
}

