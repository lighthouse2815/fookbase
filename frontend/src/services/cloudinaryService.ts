import { API_CONFIG } from '@/config/apiConfig';
import { getCloudinarySignature } from '@/services/cloudinary/util';
import type { CloudinaryUploadErrorPayload, CloudinaryUploadSuccessPayload } from '@/interface/cloudinary';

export const cloudinaryService = {
  async uploadMedia(file: File): Promise<string> {
    const signaturePayload = await getCloudinarySignature();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signaturePayload.apiKey);
    formData.append('upload_preset', signaturePayload.uploadPreset);
    formData.append('folder', signaturePayload.folder);
    formData.append('public_id', signaturePayload.publicId);
    formData.append('overwrite', String(signaturePayload.overwrite).toLowerCase());
    formData.append('timestamp', String(signaturePayload.timestamp));
    formData.append('signature', signaturePayload.signature);

    const response = await fetch(API_CONFIG.cloudinaryUploadUrl(signaturePayload.cloudName), {
      method: 'POST',
      body: formData,
    });

    const payload = (await response.json()) as CloudinaryUploadSuccessPayload & CloudinaryUploadErrorPayload;
    if (!response.ok || !payload.secure_url) {
      throw new Error(payload.error?.message ?? 'Unable to upload media to Cloudinary.');
    }

    return payload.secure_url;
  },
};
