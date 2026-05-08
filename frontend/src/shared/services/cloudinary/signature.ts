import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import type { ApiEnvelope } from '@/shared/types/api';
import type { CloudinarySignaturePayload } from '@/shared/types/cloudinary';

const { MEDIA } = API_ENDPOINTS;

export const getCloudinarySignature = async (): Promise<CloudinarySignaturePayload> => {
  const response = await apiClient.get<ApiEnvelope<CloudinarySignaturePayload>>(MEDIA.CLOUDINARY_SIGNATURE);
  const payload = response.data.data;

  if (!payload) {
    throw new Error(response.data.error?.message ?? 'Unable to generate Cloudinary signature.');
  }

  return payload;
};
