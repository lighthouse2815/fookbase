import { type FormEvent, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { ApiEnvelope, PagedResult } from '@/shared/types/api';
import type { MainLayoutOutletContext } from '@/shared/types/layout';
import type { UserProfileSearchResult } from '@/features/profile/types/contracts';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import { profileService } from '@/features/profile/api/service/profileService';
import { getApiErrorMessage } from '@/shared/api/error';
import type {
  FriendSearchActionKind,
  FriendSearchFetchState,
  FriendSearchMode,
  HashtagSearchResult,
} from '@/features/friendship/types/pages';

interface HashtagSearchResultResponseDto {
  id?: string;
  name?: string;
  usageCount?: number;
}

const HASHTAG_SEARCH_PAGE = 1;
const HASHTAG_SEARCH_PAGE_SIZE = 20;

export const useFriendSearchPage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [fetchState, setFetchState] = useState<FriendSearchFetchState>('idle');
  const [searchMode, setSearchMode] = useState<FriendSearchMode>('users');
  const [results, setResults] = useState<UserProfileSearchResult[]>([]);
  const [hashtagResults, setHashtagResults] = useState<HashtagSearchResult[]>([]);
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
      setHashtagResults([]);
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
          const hashtags = await searchHashtags(normalizedHashtagKeyword);
          if (isCancelled) {
            return;
          }

          setHashtagResults(hashtags);
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
        setHashtagResults([]);
        setFetchState('success');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setResults([]);
        setHashtagResults([]);
        setFetchState('error');
        setErrorMessage(getApiErrorMessage(error, 'Khong tim thay ket qua phu hop.'));
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
      setActionMessage('Da gui loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gui loi moi ket ban that bai.'));
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
      setActionMessage('Da huy loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Huy loi moi ket ban that bai.'));
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
      setActionMessage('Da chap nhan loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Chap nhan loi moi that bai.'));
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
      setActionMessage('Da tu choi loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Tu choi loi moi that bai.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const showEmptyState = fetchState === 'success'
    && ((searchMode === 'users' && results.length === 0) || (searchMode === 'hashtags' && hashtagResults.length === 0));

  return {
    currentUser,
    searchInput,
    setSearchInput,
    fetchState,
    searchMode,
    results,
    hashtagResults,
    errorMessage,
    actionMessage,
    actionUserId,
    actionType,
    handleSearchSubmit,
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

const searchHashtags = async (keyword: string): Promise<HashtagSearchResult[]> => {
  const response = await apiClient.get<ApiEnvelope<PagedResult<HashtagSearchResultResponseDto>>>(API_ENDPOINTS.HASHTAGS.SEARCH, {
    params: {
      keyword,
      page: HASHTAG_SEARCH_PAGE,
      pageSize: HASHTAG_SEARCH_PAGE_SIZE,
    },
  });

  const paged = extractData(response.data, 'Khong the tim hashtag.');
  const items = Array.isArray(paged.items) ? paged.items : [];

  return items.map((item, index) => ({
    id: item.id?.trim() || `hashtag-search-${index}`,
    name: item.name?.trim() || keyword,
    usageCount: typeof item.usageCount === 'number' ? Math.max(0, item.usageCount) : 0,
  }));
};
