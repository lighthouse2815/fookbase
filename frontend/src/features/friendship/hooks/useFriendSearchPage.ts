import { type FormEvent, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/shared/types/layout';
import type { UserProfileSearchResult } from '@/features/profile/types/contracts';
import type { Post } from '@/features/post/types/contracts';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import { postService } from '@/features/post/api/service/postService';
import { profileService } from '@/features/profile/api/service/profileService';
import { getApiErrorMessage } from '@/shared/api/error';
import type {
  FriendSearchActionKind,
  FriendSearchFetchState,
  FriendSearchMode,
} from '@/features/friendship/types/pages';

const HASHTAG_POSTS_FIRST_PAGE = 1;
const HASHTAG_POSTS_PAGE_SIZE = 10;

export const useFriendSearchPage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [fetchState, setFetchState] = useState<FriendSearchFetchState>('idle');
  const [searchMode, setSearchMode] = useState<FriendSearchMode>('users');
  const [results, setResults] = useState<UserProfileSearchResult[]>([]);
  const [hashtagPosts, setHashtagPosts] = useState<Post[]>([]);
  const [hashtagPage, setHashtagPage] = useState(HASHTAG_POSTS_FIRST_PAGE);
  const [hashtagHasMore, setHashtagHasMore] = useState(false);
  const [isLoadingMoreHashtagPosts, setIsLoadingMoreHashtagPosts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<FriendSearchActionKind>(null);

  const keywordQuery = searchParams.get('keyword')?.trim() ?? searchParams.get('phoneNumber')?.trim() ?? '';

  useEffect(() => {
    setSearchInput(keywordQuery);
  }, [keywordQuery]);

  useEffect(() => {
    if (!keywordQuery) {
      setFetchState('idle');
      setSearchMode('users');
      setResults([]);
      setHashtagPosts([]);
      setHashtagPage(HASHTAG_POSTS_FIRST_PAGE);
      setHashtagHasMore(false);
      setErrorMessage(null);
      return;
    }

    let isCancelled = false;

    const loadResults = async () => {
      setFetchState('loading');
      setErrorMessage(null);
      setActionMessage(null);

      try {
        const normalizedHashtagKeyword = normalizeHashtagKeyword(keywordQuery);
        if (normalizedHashtagKeyword) {
          setSearchMode('hashtags');
          const hashtagPostsPage = await postService.getPostsByHashtag(
            normalizedHashtagKeyword,
            HASHTAG_POSTS_FIRST_PAGE,
            HASHTAG_POSTS_PAGE_SIZE,
          );
          if (isCancelled) {
            return;
          }

          setHashtagPosts(hashtagPostsPage.items);
          setHashtagPage(hashtagPostsPage.page);
          setHashtagHasMore(hashtagPostsPage.hasMore);
          setResults([]);
          setFetchState('success');
          return;
        }

        setSearchMode('users');
        const users = await profileService.searchProfilesByKeyword(keywordQuery);
        if (isCancelled) {
          return;
        }

        setResults(users);
        setHashtagPosts([]);
        setHashtagPage(HASHTAG_POSTS_FIRST_PAGE);
        setHashtagHasMore(false);
        setFetchState('success');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setResults([]);
        setHashtagPosts([]);
        setHashtagPage(HASHTAG_POSTS_FIRST_PAGE);
        setHashtagHasMore(false);
        setFetchState('error');
        setErrorMessage(getApiErrorMessage(error, 'Không tìm thấy kết quả phù hợp.'));
      }
    };

    void loadResults();

    return () => {
      isCancelled = true;
    };
  }, [keywordQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedKeyword = searchInput.trim();

    if (!normalizedKeyword) {
      setSearchParams({});
      return;
    }

    setSearchParams({ keyword: normalizedKeyword });
  };

  const handleLoadMoreHashtagPosts = async () => {
    if (searchMode !== 'hashtags' || !hashtagHasMore || fetchState !== 'success' || isLoadingMoreHashtagPosts) {
      return;
    }

    const normalizedHashtagKeyword = normalizeHashtagKeyword(keywordQuery);
    if (!normalizedHashtagKeyword) {
      return;
    }

    setIsLoadingMoreHashtagPosts(true);
    setErrorMessage(null);

    try {
      const nextPage = hashtagPage + 1;
      const response = await postService.getPostsByHashtag(normalizedHashtagKeyword, nextPage, HASHTAG_POSTS_PAGE_SIZE);

      setHashtagPosts((previous) => [...previous, ...response.items]);
      setHashtagPage(response.page);
      setHashtagHasMore(response.hasMore);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Không thể tải thêm bài viết theo hashtag.'));
    } finally {
      setIsLoadingMoreHashtagPosts(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('send');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.sendFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'PENDING' } : item)),
      );
      setActionMessage('Đã gửi lời mời kết bạn.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gửi lời mời kết bạn thất bại.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleCancelSentRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('cancel');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.cancelSentRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'NONE' } : item)),
      );
      setActionMessage('Đã hủy lời mời kết bạn.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Hủy lời mời kết bạn thất bại.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleAcceptReceivedRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('accept');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.acceptFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'ACCEPTED' } : item)),
      );
      setActionMessage('Đã chấp nhận lời mời kết bạn.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Chấp nhận lời mời thất bại.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleRejectReceivedRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('reject');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.deleteFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'NONE' } : item)),
      );
      setActionMessage('Đã từ chối lời mời kết bạn.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Từ chối lời mời thất bại.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleHashtagPostDeleted = (postId: string) => {
    setHashtagPosts((previous) => previous.filter((post) => post.id !== postId));
  };

  const handleHashtagPostUpdated = (updatedPost: Post) => {
    setHashtagPosts((previous) =>
      previous.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  };

  const showEmptyState = fetchState === 'success'
    && ((searchMode === 'users' && results.length === 0) || (searchMode === 'hashtags' && hashtagPosts.length === 0));

  return {
    currentUser,
    searchInput,
    setSearchInput,
    fetchState,
    searchMode,
    results,
    hashtagPosts,
    hashtagHasMore,
    isLoadingMoreHashtagPosts,
    errorMessage,
    actionMessage,
    actionUserId,
    actionType,
    handleSearchSubmit,
    handleLoadMoreHashtagPosts,
    handleHashtagPostDeleted,
    handleHashtagPostUpdated,
    handleSendFriendRequest,
    handleCancelSentRequest,
    handleAcceptReceivedRequest,
    handleRejectReceivedRequest,
    showEmptyState,
  };
};

const normalizeHashtagKeyword = (keyword: string): string | null => {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword.startsWith('#')) {
    return null;
  }

  const hashtagKeyword = normalizedKeyword.slice(1).trim();
  return hashtagKeyword.length > 0 ? hashtagKeyword : null;
};
