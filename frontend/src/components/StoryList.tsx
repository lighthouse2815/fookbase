import { useTranslation } from 'react-i18next';

import type { Story } from '../types/post';

interface StoryListProps {
  stories: Story[];
}

export const StoryList = ({ stories }: StoryListProps) => {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('home.stories')}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stories.map((story) => (
          <article
            key={story.id}
            className="relative h-44 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"
          >
            <img src={story.imageUrl} alt={story.author.fullName} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-xs font-medium text-white">{story.author.fullName}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

