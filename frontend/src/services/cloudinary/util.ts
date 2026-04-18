import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import type { ApiEnvelope } from '@/interface/api';
import type { CloudinarySignaturePayload } from '@/interface/cloudinary';

const { MEDIA } = API_CONFIG.ENDPOINTS;

export const getCloudinarySignature = async (): Promise<CloudinarySignaturePayload> => {
  const response = await apiClient.get<ApiEnvelope<CloudinarySignaturePayload>>(MEDIA.CLOUDINARY_SIGNATURE);
  const payload = response.data.data;

  if (!payload) {
    throw new Error(response.data.errors?.[0] ?? 'Unable to generate Cloudinary signature.');
  }

  return payload;
};
