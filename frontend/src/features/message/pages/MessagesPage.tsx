import { useMessagesPage } from '@/features/message/hooks/useMessagesPage';
import { MessagesConversationDetail } from '@/features/message/components/MessagesConversationDetail';
import { MessagesCreateGroupDialog } from '@/features/message/components/MessagesCreateGroupDialog';
import { MessagesSidebar } from '@/features/message/components/MessagesSidebar';

export const MessagesPage = () => {
  const {
    t,
    currentUser,
    fetchState,
    activeTab,
    setActiveTab,
    searchValue,
    setSearchValue,
    errorMessage,
    chatTabs,
    filteredConversations,
    isMobileViewport,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
    selectedMessages,
    loadingConversationId,
    messageError,
    composerValue,
    setComposerValue,
    isSending,
    isRealtimeConnected,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    groupName,
    setGroupName,
    selectedMemberIds,
    groupError,
    isCreatingGroup,
    friendCandidates,
    messagesViewportRef,
    handleSendMessage,
    closeGroupDialog,
    handleToggleMember,
    handleCreateGroup,
    tabCount,
  } = useMessagesPage();

  const showConversationList = !isMobileViewport || !selectedConversation;
  const showConversationDetail = !isMobileViewport || Boolean(selectedConversation);

  if (fetchState === 'loading') {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:rounded-3xl">
        <div className="grid min-h-[calc(100dvh-10rem)] grid-cols-1 lg:min-h-[75vh] lg:grid-cols-[320px_minmax(0,1fr)]">
          <MessagesSidebar
            t={t}
            showConversationList={showConversationList}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            errorMessage={errorMessage}
            chatTabs={chatTabs}
            tabCount={tabCount}
            filteredConversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          />

          <MessagesConversationDetail
            t={t}
            showConversationDetail={showConversationDetail}
            selectedConversation={selectedConversation}
            selectedMessages={selectedMessages}
            loadingConversationId={loadingConversationId}
            messageError={messageError}
            currentUserId={currentUser.id}
            composerValue={composerValue}
            setComposerValue={setComposerValue}
            isSending={isSending}
            isRealtimeConnected={isRealtimeConnected}
            isMobileViewport={isMobileViewport}
            messagesViewportRef={messagesViewportRef}
            onBack={() => setSelectedConversationId(null)}
            onSendMessage={handleSendMessage}
          />
        </div>
      </section>

      <MessagesCreateGroupDialog
        t={t}
        isOpen={isCreateGroupOpen}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedMemberIds={selectedMemberIds}
        groupError={groupError}
        isCreatingGroup={isCreatingGroup}
        friendCandidates={friendCandidates}
        onClose={closeGroupDialog}
        onToggleMember={handleToggleMember}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
};
