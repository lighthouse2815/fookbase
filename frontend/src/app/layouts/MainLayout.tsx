import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/shared/types/layout';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { ReviewPromptModal } from '@/features/appReview/components/ReviewPromptModal';
import { useReviewPromptTrigger } from '@/features/appReview/hooks/useReviewPromptTrigger';
import { MainBottomNav } from '@/app/layouts/components/navigation/MainBottomNav';
import { Navbar } from '@/app/layouts/components/navbar/Navbar';
import { SidebarLeft } from '@/app/layouts/components/sidebar/SidebarLeft';
import { SidebarRight } from '@/app/layouts/components/sidebar/SidebarRight';
import { useMainLayoutData } from '@/app/layouts/hooks/useMainLayoutData';
import { getMainLayoutVisibilityState } from '@/app/layouts/utils/mainLayout.util';

export const MainLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isPromptOpen, dismissPrompt, completePrompt } = useReviewPromptTrigger();
  const location = useLocation();
  const { isProfilePage, hideLeftSidebar, hideRightSidebar } = getMainLayoutVisibilityState(
    location.pathname,
  );
  const {
    suggestions,
    onlineUsers,
    offlineUsers,
    notifications,
    onAddFriend,
    onOpenNotification,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onMarkAllNotificationsAsRead,
  } = useMainLayoutData();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  const currentUser = user;
  const outletContext: MainLayoutOutletContext = {
    currentUser,
    suggestions,
    onlineUsers,
    offlineUsers,
    notifications,
  };

  return (
    <>
      <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <Navbar
          currentUser={currentUser}
          notifications={notifications}
          onOpenNotification={(item) => {
            void onOpenNotification(item);
          }}
          onAcceptFriendRequest={onAcceptFriendRequest}
          onRejectFriendRequest={onRejectFriendRequest}
          onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
          onLogout={logout}
        />

        <div
          className={`mx-auto grid w-full max-w-[1440px] gap-3 px-2 pb-24 pt-[7.25rem] sm:gap-4 sm:px-3 md:pb-8 md:pt-20 md:px-4 lg:px-6 ${
            hideLeftSidebar
              ? 'md:grid-cols-[minmax(0,1fr)]'
              : hideRightSidebar
                ? 'md:grid-cols-[260px_minmax(0,1fr)]'
                : 'md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]'
          }`}
        >
          {hideLeftSidebar ? null : (
            <div className="sticky top-20 hidden max-h-[calc(100dvh-5.75rem)] overflow-y-auto md:block">
              <SidebarLeft currentUser={currentUser} />
            </div>
          )}

          <main className={`min-w-0 w-full space-y-4 ${isProfilePage ? 'mx-auto max-w-[1280px]' : ''}`}>
            <Outlet context={outletContext} />
          </main>

          {hideRightSidebar ? null : (
            <div className="sticky top-20 hidden max-h-[calc(100dvh-5.75rem)] overflow-y-auto xl:block">
              <SidebarRight
                suggestions={suggestions}
                onlineUsers={onlineUsers}
                offlineUsers={offlineUsers}
                onAddFriend={(friendId) => {
                  void onAddFriend(friendId);
                }}
              />
            </div>
          )}
        </div>

        <MainBottomNav />
      </div>

      <ReviewPromptModal isOpen={isPromptOpen} onClose={dismissPrompt} onSubmitted={completePrompt} />
    </>
  );
};
