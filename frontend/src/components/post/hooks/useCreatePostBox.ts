import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CreatePostDraft } from '@/interface/post';

import type { CreatePostBoxProps } from '../interface';
import type { CreatePostMediaKind } from '../type';
import {
  CREATE_POST_ICON_OPTIONS,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_VIDEO_FILE_SIZE_BYTES,
  detectKindFromFile,
} from '../util';

type UseCreatePostBoxParams = Pick<CreatePostBoxProps, 'onCreatePost'>;

export const useCreatePostBox = ({ onCreatePost }: UseCreatePostBoxParams) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | undefined>(undefined);
  const [selectedMediaPreviewUrl, setSelectedMediaPreviewUrl] = useState<string | undefined>(undefined);
  const [selectedMediaKind, setSelectedMediaKind] = useState<CreatePostMediaKind>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 320)}px`;
  }, [content]);

  useEffect(() => {
    return () => {
      if (selectedMediaPreviewUrl) {
        URL.revokeObjectURL(selectedMediaPreviewUrl);
      }
    };
  }, [selectedMediaPreviewUrl]);

  const updateMediaPreview = useCallback((nextPreviewUrl?: string) => {
    setSelectedMediaPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return nextPreviewUrl;
    });
  }, []);

  const handleMediaFileChange = useCallback(
    (file: File) => {
      const detectedKind = detectKindFromFile(file);
      if (!detectedKind) {
        setMediaError(t('home.mediaTypeNotSupported'));
        return;
      }

      if (detectedKind === 'image' && file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        setMediaError(t('home.imageTooLarge'));
        return;
      }

      if (detectedKind === 'video' && file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
        setMediaError(t('home.videoTooLarge'));
        return;
      }

      setSelectedMediaFile(file);
      setSelectedMediaKind(detectedKind);
      updateMediaPreview(URL.createObjectURL(file));
      setMediaError(null);
    },
    [t, updateMediaPreview],
  );

  const clearSelectedMedia = useCallback(() => {
    setSelectedMediaFile(undefined);
    setSelectedMediaKind(null);
    updateMediaPreview(undefined);
    setMediaError(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [updateMediaPreview]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();

    if (!trimmed && !selectedMediaFile) {
      return;
    }

    const draft: CreatePostDraft = {
      content: trimmed,
      mediaFile: selectedMediaFile,
    };

    const isCreated = await onCreatePost(draft);

    if (isCreated) {
      setContent('');
      clearSelectedMedia();
      setIsIconPickerOpen(false);
    }
  }, [clearSelectedMedia, content, onCreatePost, selectedMediaFile]);

  const handleCancelDraft = useCallback(() => {
    setContent('');
    clearSelectedMedia();
    setIsIconPickerOpen(false);
  }, [clearSelectedMedia]);

  const hasDraft = Boolean(content.trim() || selectedMediaFile);

  return {
    t,
    content,
    setContent,
    selectedMediaFile,
    selectedMediaPreviewUrl,
    selectedMediaKind,
    mediaError,
    isIconPickerOpen,
    setIsIconPickerOpen,
    imageInputRef,
    videoInputRef,
    textareaRef,
    handleMediaFileChange,
    clearSelectedMedia,
    handleSubmit,
    handleCancelDraft,
    hasDraft,
    iconOptions: CREATE_POST_ICON_OPTIONS,
  };
};
