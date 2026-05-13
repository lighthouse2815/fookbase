import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { NavbarProps } from './interface';
import type { NavbarPopover, NavbarPopoverOpen } from './type';
import {
  buildFriendsSearchPath,
  countUnreadNotifications,
  parseSearchKeywordFromSearch,
} from './util';

export function useNavBar({
  notifications,
  onOpenNotification,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onMarkAllNotificationsAsRead,
  onLogout,
}: NavbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const popoverRootRef = useRef<HTMLDivElement | null>(null);
  const routeKey = `${location.pathname}?${location.search}`;
  const isFriendsSearchPage = location.pathname.startsWith('/friends/search');
  const defaultSearchKeyword = isFriendsSearchPage ? parseSearchKeywordFromSearch(location.search) : '';
  const [popoverState, setPopoverState] = useState<{ routeKey: string; value: NavbarPopover }>(() => ({
    routeKey,
    value: null,
  }));
  const [searchState, setSearchState] = useState<{ routeKey: string; value: string }>(() => ({
    routeKey,
    value: defaultSearchKeyword,
  }));
  const openPopover = popoverState.routeKey === routeKey ? popoverState.value : null;
  const searchKeyword = searchState.routeKey === routeKey ? searchState.value : defaultSearchKeyword;
  const isMenuOpen = openPopover === 'menu';
  const isNotificationOpen = openPopover === 'notification';
  const isSettingsPage = location.pathname.startsWith('/settings');
  const setOpenPopover = (value: NavbarPopover) => {
    setPopoverState({ routeKey, value });
  };
  const setSearchKeyword = (value: string) => {
    setSearchState({ routeKey, value });
  };

  const unreadCount = countUnreadNotifications(notifications);

  useEffect(() => {
    if (!openPopover) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!popoverRootRef.current || (target && popoverRootRef.current.contains(target))) {
        return;
      }

      setPopoverState((current) => ({ ...current, value: null }));
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPopoverState((current) => ({ ...current, value: null }));
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openPopover]);

  const handleSearchSubmit = () => {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) {
      return;
    }

    navigate(buildFriendsSearchPath(normalizedKeyword));
  };

  const togglePopover = (popover: NavbarPopoverOpen) => {
    setOpenPopover(openPopover === popover ? null : popover);
  };

  return {
    t,
    searchKeyword,
    setSearchKeyword,
    popoverRootRef,
    openPopover,
    setOpenPopover,
    isMenuOpen,
    isNotificationOpen,
    isSettingsPage,
    unreadCount,
    handleSearchSubmit,
    togglePopover,
    notifications,
    onOpenNotification,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onMarkAllNotificationsAsRead,
    onLogout,
  };
}
