import type { PaginatedResult } from '@/interface/api';
import type { Post, PostReactionType } from '@/interface/post';

export type { PostReactionType };
export type PaginatedPosts = PaginatedResult<Post>;
export type PaginatedSavedPosts = PaginatedResult<Post>;
