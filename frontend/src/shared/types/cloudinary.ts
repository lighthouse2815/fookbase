export interface CloudinarySignaturePayload {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  folder: string;
  publicId: string;
  overwrite: boolean;
  timestamp: number;
  signature: string;
}

export interface CloudinaryUploadErrorPayload {
  error?: {
    message?: string;
  };
}

export interface CloudinaryUploadSuccessPayload {
  secure_url?: string;
}
