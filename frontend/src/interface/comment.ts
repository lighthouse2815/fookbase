import type { CommentReactionUserPayload } from "@/services/comment/interface";

export interface CommentAuthorPayload {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  }
  
  export interface CommentPayload {
    id: string;
    postId: string;
    parentCommentId?: string | null;
    userId: string;
    author?: CommentAuthorPayload;
    content: string;
    createdAt: string;
    updatedAt: string;
    currentUserReactionType?: string | null;
    reactionCount?: number;
    topReactionTypes?: string[] | null;
    replyCount?: number;
    replies?: CommentPayload[] | null;
  }

  export interface CommentReactionUsersPayload {
    commentId: string;
    totalCount?: number;
    users?: CommentReactionUserPayload[] | null;
  }