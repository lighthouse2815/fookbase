import { Image, Info, Newspaper } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProfilePreviewTabItem } from '../interface';
import type { PreviewTab } from '../type';

export function useProfilePreview() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PreviewTab>('posts');

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
