import { useState } from 'react';
import { Image, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { User } from '../types/user';

interface CreatePostBoxProps {
  currentUser: User;
  isSubmitting?: boolean;
  onCreatePost: (content: string) => Promise<void> | void;
}

export const CreatePostBox = ({ currentUser, isSubmitting = false, onCreatePost }: CreatePostBoxProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    await onCreatePost(trimmed);
    setContent('');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-start gap-3">
        <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-11 w-11 rounded-full object-cover" />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('home.createPostPlaceholder')}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700" type="button">
            <Image size={18} />
          </button>
          <button className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700" type="button">
            <Smile size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t('common.loading') : t('home.postButton')}
        </button>
      </div>
    </section>
  );
};

