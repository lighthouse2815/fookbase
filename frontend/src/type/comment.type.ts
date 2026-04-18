import type { PaginatedResult } from '@/interface/api';
import type { Comment } from '@/interface/post';

export type PaginatedComments = PaginatedResult<Comment>;
