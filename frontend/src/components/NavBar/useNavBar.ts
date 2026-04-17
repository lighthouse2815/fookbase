import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/ThemeContext';

import type { NavbarProps } from './interface';
import type { NavbarPopover, NavbarPopoverOpen } from './type';
import {
  buildFriendsSearchPath,
  countUnreadNotifications,
  parsePhoneNumberFromSearch,
} from './util';

export function useNavBar({
  notifications,
  onOpenNotification,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onMarkAllNotificationsAsRead,
  onLogout,
}: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openPopover, setOpenPopover] = useState<NavbarPopover>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const popoverRootRef = useRef<HTMLDivElement | null>(null);
  const isMenuOpen = openPopover === 'menu';
  const isNotificationOpen = openPopover === 'notification';
  const isLanguageOpen = openPopover === 'language';
  const isSettingsPage = location.pathname.startsWith('/settings');
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const isVietnameseActive = currentLanguage.startsWith('vi');
  const isEnglishActive = currentLanguage.startsWith('en');

  const unreadCount = countUnreadNotifications(notifications);

  useEffect(() => {
    if (!location.pathname.startsWith('/friends/search')) {
      return;
    }

    setSearchKeyword(parsePhoneNumberFromSearch(location.search));
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!openPopover) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!popoverRootRef.current || (target && popoverRootRef.current.contains(target))) {
        return;
      }

      setOpenPopover(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPopover(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openPopover]);

  useEffect(() => {
    setOpenPopover(null);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = () => {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) {
      return;
    }

    navigate(buildFriendsSearchPath(normalizedKeyword));
  };

  const togglePopover = (popover: NavbarPopoverOpen) => {
    setOpenPopover((current) => (current === popover ? null : popover));
  };

  return {
    t,
    i18n,
    theme,
    toggleTheme,
    searchKeyword,
    setSearchKeyword,
    popoverRootRef,
    openPopover,
    setOpenPopover,
    isMenuOpen,
    isNotificationOpen,
    isLanguageOpen,
    isSettingsPage,
    isVietnameseActive,
    isEnglishActive,
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
