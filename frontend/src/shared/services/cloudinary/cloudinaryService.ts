import { buildCloudinaryUploadUrl } from '@/shared/config/cloudinary';
import { getCloudinarySignature } from '@/shared/services/cloudinary/signature';
import type { CloudinaryUploadErrorPayload, CloudinaryUploadSuccessPayload } from '@/shared/types/cloudinary';

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

    const response = await fetch(buildCloudinaryUploadUrl(signaturePayload.cloudName), {
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
