import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

export type AdminPopover = 'language' | 'profile' | null;

interface UseAdminLayoutResult {
  popoverRootRef: RefObject<HTMLDivElement>;
  openPopover: AdminPopover;
  isSidebarOpen: boolean;
  isVietnameseActive: boolean;
  isEnglishActive: boolean;
  togglePopover: (popover: Exclude<AdminPopover, null>) => void;
  closePopover: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  changeLanguage: (language: 'vi' | 'en') => Promise<void>;
}

export const useAdminLayout = (): UseAdminLayoutResult => {
  const { i18n } = useTranslation();
  const [openPopover, setOpenPopover] = useState<AdminPopover>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const popoverRootRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const isVietnameseActive = currentLanguage.startsWith('vi');
  const isEnglishActive = currentLanguage.startsWith('en');

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

  const togglePopover = (popover: Exclude<AdminPopover, null>) => {
    setOpenPopover((current) => (current === popover ? null : popover));
  };

  const closePopover = () => {
    setOpenPopover(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((value) => !value);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const changeLanguage = async (language: 'vi' | 'en') => {
    await i18n.changeLanguage(language);
    setOpenPopover(null);
  };

  return {
    popoverRootRef,
    openPopover,
    isSidebarOpen,
    isVietnameseActive,
    isEnglishActive,
    togglePopover,
    closePopover,
    toggleSidebar,
    closeSidebar,
    changeLanguage,
  };
};
