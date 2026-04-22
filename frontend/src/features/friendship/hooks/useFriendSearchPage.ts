import { type FormEvent, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/shared/types/layout';
import type { UserProfileSearchResult } from '@/features/profile/types/contracts';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import { profileService } from '@/features/profile/api/service/profileService';
import { getApiErrorMessage } from '@/shared/api/error';
import type { FriendSearchActionKind, FriendSearchFetchState } from '@/features/friendship/types/pages';

export const useFriendSearchPage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [fetchState, setFetchState] = useState<FriendSearchFetchState>('idle');
  const [results, setResults] = useState<UserProfileSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<FriendSearchActionKind>(null);

  const phoneNumberQuery = searchParams.get('phoneNumber')?.trim() ?? '';

  useEffect(() => {
    setSearchInput(phoneNumberQuery);
  }, [phoneNumberQuery]);

  useEffect(() => {
    if (!phoneNumberQuery) {
      setFetchState('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    let isCancelled = false;

    const loadResults = async () => {
      setFetchState('loading');
      setErrorMessage(null);
      setActionMessage(null);

      try {
        const response = await profileService.searchProfilesByPhoneNumber(phoneNumberQuery);
        if (isCancelled) {
          return;
        }

        setResults(response);
        setFetchState('success');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setResults([]);
        setFetchState('error');
        setErrorMessage(getApiErrorMessage(error, 'Khong tim thay nguoi dung phu hop.'));
      }
    };

    void loadResults();

    return () => {
      isCancelled = true;
    };
  }, [phoneNumberQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhoneNumber = searchInput.trim();

    if (!normalizedPhoneNumber) {
      setSearchParams({});
      return;
    }

    setSearchParams({ phoneNumber: normalizedPhoneNumber });
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

  const showEmptyState = fetchState === 'success' && results.length === 0;

  return {
    currentUser,
    searchInput,
    setSearchInput,
    fetchState,
    results,
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



