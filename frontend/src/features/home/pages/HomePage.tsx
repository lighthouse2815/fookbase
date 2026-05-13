import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { useAuthSuccessTransition } from '@/features/auth/contexts/AuthSuccessTransitionContext';
import { CreatePostBox } from '@/features/post/components/CreatePostBox';
import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { PostCard } from '@/features/post/components/PostCard';
import { StoryList } from '@/features/story/components/StoryList';
import { useHomePage } from '@/features/home/hooks/useHomePage';

export const HomePage = () => {
  const { landingTone, clearLandingTone } = useAuthSuccessTransition();
  const {
    t,
    currentUser,
    feed,
    isLoading,
    isSubmitting,
    loadError,
    createError,
    hasMore,
    loadMoreSentinelRef,
    toast,
    showToast,
    handleCreatePost,
    handlePostDeleted,
    handlePostUpdated,
    postColumnClass,
  } = useHomePage();

  useEffect(() => {
    if (!landingTone) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearLandingTone();
    }, 760);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [clearLandingTone, landingTone]);

  return (
    <motion.div
      className="space-y-4"
      initial={
        landingTone
          ? { opacity: 0.4, y: 18, scale: 0.995 }
          : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
    >
      {landingTone ? (
        <motion.div
          className={`h-1 w-full rounded-full ${
            landingTone === 'admin'
              ? 'bg-gradient-to-r from-rose-500/70 via-amber-400/55 to-transparent'
              : 'bg-gradient-to-r from-brand-500/70 via-sky-400/55 to-transparent'
          }`}
          initial={{ opacity: 0, scaleX: 0.4, transformOrigin: 'left center' }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        />
      ) : null}

      <motion.section
        className={`${postColumnClass} space-y-4`}
        initial={landingTone ? { opacity: 0.6, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: landingTone ? 0.12 : 0 }}
      >
        <CreatePostBox currentUser={currentUser} isSubmitting={isSubmitting} onCreatePost={handleCreatePost} />
        {createError ? <p className="text-sm text-rose-600 dark:text-rose-400">{createError}</p> : null}
        <StoryList currentUser={currentUser} onActionToast={showToast} />

        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('home.feedTitle')}</h1>
        {loadError ? <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p> : null}
        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            enableMediaViewer
            onActionToast={showToast}
            onPostDeleted={handlePostDeleted}
            onPostUpdated={handlePostUpdated}
          />
        ))}
      </motion.section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <div className="flex flex-col items-center gap-2">
            <div ref={loadMoreSentinelRef} className="h-1 w-full" aria-hidden />
            {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.noMorePosts')}</p>
        )}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </motion.div>
  );
};


