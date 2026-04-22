import { useEffect, useRef } from 'react';

import { FriendshipFriendsSection } from '@/features/friendship/components/FriendshipFriendsSection';
import { FriendsPageSkeleton } from '@/features/friendship/components/FriendsPageSkeleton';
import { FriendshipHomeSection } from '@/features/friendship/components/FriendshipHomeSection';
import { FriendshipPageHeader } from '@/features/friendship/components/FriendshipPageHeader';
import { FriendshipRequestsSection } from '@/features/friendship/components/FriendshipRequestsSection';
import { FriendshipSidebar } from '@/features/friendship/components/FriendshipSidebar';
import { FriendshipSuggestionsSection } from '@/features/friendship/components/FriendshipSuggestionsSection';
import { FriendshipUnfriendDialog } from '@/features/friendship/components/FriendshipUnfriendDialog';
import { ProfilePreview } from '@/features/friendship/components/ProfilePreview';
import { useFriendsPage } from '@/features/friendship/hooks/useFriendsPage';
import type { ProfileRelation } from '@/features/friendship/types/pages';

export const FriendsPage = () => {
  const {
    t,
    activeTab,
    fetchState,
    isPreviewOpen,
    selectedUserId,
    isSidebarOpen,
    setIsSidebarOpen,
    errorMessage,
    receivedRequests,
    sentRequests,
    suggestions,
    friends,
    friendSearch,
    setFriendSearch,
    friendFilter,
    setFriendFilter,
    confirmUnfriendUser,
    isUnfriendSubmitting,
    sidebarTabs,
    friendFilters,
    loadFriendData,
    handleChangeTab,
    handleSelectUser,
    closePreview,
    selectedProfile,
    filteredFriends,
    handleConfirmRequest,
    handleDeleteReceivedRequest,
    handleCancelSentRequest,
    handleAddFriend,
    handleMessageUser,
    requestUnfriend,
    closeUnfriendDialog,
    handleConfirmUnfriend,
    tabTitle,
    selectedSuggestion,
    selectedReceivedRequest,
    selectedSentRequest,
    selectedFriend,
  } = useFriendsPage();
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (previewRef.current?.contains(target)) {
        return;
      }

      const trigger = target instanceof Element
        ? target.closest('[data-profile-preview-trigger="true"]')
        : null;

      if (trigger) {
        return;
      }

      closePreview();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [closePreview, isPreviewOpen]);

  if (fetchState === 'loading') {
    return <FriendsPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <FriendshipPageHeader
        t={t}
        tabTitle={tabTitle}
        errorMessage={errorMessage}
        loadFriendData={loadFriendData}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-4">
        <FriendshipSidebar
          t={t}
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarTabs={sidebarTabs}
          receivedRequests={receivedRequests}
          suggestions={suggestions}
          friends={friends}
          handleChangeTab={handleChangeTab}
        />

        <main className="min-w-0 space-y-4">
          {activeTab === 'home' ? (
            <FriendshipHomeSection
              t={t}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              suggestions={suggestions}
              selectedUserId={selectedUserId}
              handleSelectUser={handleSelectUser}
              handleConfirmRequest={handleConfirmRequest}
              handleDeleteReceivedRequest={handleDeleteReceivedRequest}
              handleCancelSentRequest={handleCancelSentRequest}
              handleAddFriend={handleAddFriend}
            />
          ) : null}

          {activeTab === 'requests' ? (
            <FriendshipRequestsSection
              t={t}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              selectedUserId={selectedUserId}
              handleSelectUser={handleSelectUser}
              handleConfirmRequest={handleConfirmRequest}
              handleDeleteReceivedRequest={handleDeleteReceivedRequest}
              handleCancelSentRequest={handleCancelSentRequest}
            />
          ) : null}

          {activeTab === 'suggestions' ? (
            <FriendshipSuggestionsSection
              t={t}
              suggestions={suggestions}
              selectedUserId={selectedUserId}
              handleSelectUser={handleSelectUser}
              handleAddFriend={handleAddFriend}
            />
          ) : null}

          {activeTab === 'friends' ? (
            <FriendshipFriendsSection
              t={t}
              filteredFriends={filteredFriends}
              friendSearch={friendSearch}
              setFriendSearch={setFriendSearch}
              friendFilters={friendFilters}
              friendFilter={friendFilter}
              setFriendFilter={setFriendFilter}
              selectedUserId={selectedUserId}
              handleSelectUser={handleSelectUser}
              handleMessageUser={handleMessageUser}
              requestUnfriend={requestUnfriend}
            />
          ) : null}
        </main>
      </div>

      {isPreviewOpen && selectedProfile?.user ? (
        <div
          ref={previewRef}
          className="fixed inset-x-2.5 bottom-[5.5rem] top-[5.5rem] z-[80] overflow-y-auto md:inset-x-auto md:bottom-auto md:right-8 md:top-24 md:max-h-[calc(100dvh-7rem)] md:w-[min(22.5rem,calc(100vw-2rem))] xl:right-10"
        >
          <ProfilePreview
            user={selectedProfile.user}
            relation={(selectedProfile.relation ?? null) as ProfileRelation}
            onClose={closePreview}
            onAddFriend={
              selectedSuggestion
                ? () => {
                    void handleAddFriend(selectedSuggestion.id);
                  }
                : undefined
            }
            onConfirmRequest={
              selectedReceivedRequest
                ? () => {
                    void handleConfirmRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onDeleteRequest={
              selectedReceivedRequest
                ? () => {
                    void handleDeleteReceivedRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onCancelRequest={
              selectedSentRequest
                ? () => {
                    void handleCancelSentRequest(selectedSentRequest.requestId);
                  }
                : undefined
            }
            onUnfriend={
              selectedFriend
                ? () => {
                    requestUnfriend(selectedFriend.id);
                  }
                : undefined
            }
            onMessage={
              selectedFriend
                ? () => {
                    handleMessageUser(selectedFriend.id);
                  }
                : undefined
            }
          />
        </div>
      ) : null}

      <FriendshipUnfriendDialog
        t={t}
        confirmUnfriendUser={confirmUnfriendUser}
        closeUnfriendDialog={closeUnfriendDialog}
        isUnfriendSubmitting={isUnfriendSubmitting}
        handleConfirmUnfriend={handleConfirmUnfriend}
      />
    </div>
  );
};
