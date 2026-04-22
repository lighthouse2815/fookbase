import { Image, Info, Newspaper } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PreviewTab, ProfilePreviewTabItem } from '@/features/friendship/types/components';

export function useProfilePreview(userId?: string) {
  const { t } = useTranslation();
  const [activeTabByUserId, setActiveTabByUserId] = useState<Record<string, PreviewTab>>({});
  const normalizedUserId = userId?.trim().toLowerCase() ?? '__anonymous__';
  const activeTab = activeTabByUserId[normalizedUserId] ?? 'posts';
  const setActiveTab = useCallback(
    (tab: PreviewTab) => {
      setActiveTabByUserId((current) => ({
        ...current,
        [normalizedUserId]: tab,
      }));
    },
    [normalizedUserId],
  );

  const previewTabs = useMemo<ProfilePreviewTabItem[]>(
    () => [
      { id: 'posts', label: t('friendsPage.preview.tabs.posts'), icon: Newspaper },
      { id: 'photos', label: t('friendsPage.preview.tabs.photos'), icon: Image },
      { id: 'about', label: t('friendsPage.preview.tabs.about'), icon: Info },
    ],
    [t],
  );

  return { activeTab, setActiveTab, previewTabs };
}
