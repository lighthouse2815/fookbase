import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CreatePostDraft } from '@/features/post/types/contracts';
import type { CreatePostBoxProps, CreatePostMediaKind } from '@/features/post/types/components';
import {
  CREATE_POST_ICON_OPTIONS,
  MAX_IMAGE_FILES_PER_POST,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_VIDEO_FILE_SIZE_BYTES,
} from '@/features/post/utils/constants';
import { detectMediaKindFromFile } from '@/features/post/utils/media';

type UseCreatePostBoxParams = Pick<CreatePostBoxProps, 'onCreatePost'>;

export const useCreatePostBox = ({ onCreatePost }: UseCreatePostBoxParams) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedImagePreviewUrls, setSelectedImagePreviewUrls] = useState<string[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | undefined>(undefined);
  const [selectedVideoPreviewUrl, setSelectedVideoPreviewUrl] = useState<string | undefined>(undefined);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedMediaKind: CreatePostMediaKind = selectedVideoFile
    ? 'video'
    : selectedImageFiles.length > 0
      ? 'image'
      : null;

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 320)}px`;
  }, [content]);

  useEffect(() => {
    return () => {
      selectedImagePreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      if (selectedVideoPreviewUrl) {
        URL.revokeObjectURL(selectedVideoPreviewUrl);
      }
    };
  }, [selectedImagePreviewUrls, selectedVideoPreviewUrl]);

  const updateImagePreviews = useCallback((nextFiles: File[]) => {
    setSelectedImagePreviewUrls((previous) => {
      previous.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      return nextFiles.map((file) => URL.createObjectURL(file));
    });
  }, []);

  const updateVideoPreview = useCallback((nextPreviewUrl?: string) => {
    setSelectedVideoPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return nextPreviewUrl;
    });
  }, []);

  const handleImageFilesChange = useCallback(
    (files: FileList | File[]) => {
      if (selectedVideoFile) {
        setMediaError('Remove selected video before adding images.');
        return;
      }

      const selectedFiles = Array.from(files);
      if (selectedFiles.length === 0) {
        return;
      }

      const remainingSlots = Math.max(0, MAX_IMAGE_FILES_PER_POST - selectedImageFiles.length);
      if (remainingSlots <= 0) {
        setMediaError(`You can attach up to ${MAX_IMAGE_FILES_PER_POST} images.`);
        return;
      }

      const acceptedImages: File[] = [];
      for (const file of selectedFiles) {
        if (acceptedImages.length >= remainingSlots) {
          break;
        }

        const detectedKind = detectMediaKindFromFile(file);
        if (!detectedKind) {
          setMediaError(t('home.mediaTypeNotSupported'));
          continue;
        }

        if (detectedKind !== 'image') {
          setMediaError('Only images are allowed in this selector.');
          continue;
        }

        if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
          setMediaError(t('home.imageTooLarge'));
          continue;
        }

        acceptedImages.push(file);
      }

      if (acceptedImages.length === 0) {
        return;
      }

      const nextFiles = [...selectedImageFiles, ...acceptedImages];
      setSelectedImageFiles(nextFiles);
      updateImagePreviews(nextFiles);
      setMediaError(null);
    },
    [selectedImageFiles, selectedVideoFile, t, updateImagePreviews],
  );

  const handleVideoFileChange = useCallback(
    (file: File) => {
      if (selectedImageFiles.length > 0) {
        setMediaError('Remove selected images before adding a video.');
        return;
      }

      const detectedKind = detectMediaKindFromFile(file);
      if (!detectedKind) {
        setMediaError(t('home.mediaTypeNotSupported'));
        return;
      }

      if (detectedKind !== 'video') {
        setMediaError('Only videos are allowed in this selector.');
        return;
      }

      if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
        setMediaError(t('home.videoTooLarge'));
        return;
      }

      setSelectedVideoFile(file);
      updateVideoPreview(URL.createObjectURL(file));
      setMediaError(null);
    },
    [selectedImageFiles.length, t, updateVideoPreview],
  );

  const removeSelectedImage = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= selectedImageFiles.length) {
        return;
      }

      const nextFiles = selectedImageFiles.filter((_, index) => index !== targetIndex);
      setSelectedImageFiles(nextFiles);
      updateImagePreviews(nextFiles);
      setMediaError(null);

      if (nextFiles.length === 0 && imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    },
    [selectedImageFiles, updateImagePreviews],
  );

  const clearSelectedMedia = useCallback(() => {
    setSelectedImageFiles([]);
    setSelectedVideoFile(undefined);
    updateImagePreviews([]);
    updateVideoPreview(undefined);
    setMediaError(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [updateImagePreviews, updateVideoPreview]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();

    if (!trimmed && !selectedVideoFile && selectedImageFiles.length === 0) {
      return;
    }

    const draft: CreatePostDraft = {
      content: trimmed,
      imageFiles: selectedImageFiles.length > 0 ? selectedImageFiles : undefined,
      videoFile: selectedVideoFile,
    };

    const isCreated = await onCreatePost(draft);

    if (isCreated) {
      setContent('');
      clearSelectedMedia();
      setIsIconPickerOpen(false);
    }
  }, [clearSelectedMedia, content, onCreatePost, selectedImageFiles, selectedVideoFile]);

  const handleCancelDraft = useCallback(() => {
    setContent('');
    clearSelectedMedia();
    setIsIconPickerOpen(false);
  }, [clearSelectedMedia]);

  const hasDraft = Boolean(content.trim() || selectedVideoFile || selectedImageFiles.length > 0);

  return {
    t,
    content,
    setContent,
    selectedImageFiles,
    selectedImagePreviewUrls,
    selectedVideoFile,
    selectedVideoPreviewUrl,
    selectedMediaKind,
    mediaError,
    isIconPickerOpen,
    setIsIconPickerOpen,
    imageInputRef,
    videoInputRef,
    textareaRef,
    handleImageFilesChange,
    handleVideoFileChange,
    removeSelectedImage,
    clearSelectedMedia,
    handleSubmit,
    handleCancelDraft,
    hasDraft,
    iconOptions: CREATE_POST_ICON_OPTIONS,
  };
};
