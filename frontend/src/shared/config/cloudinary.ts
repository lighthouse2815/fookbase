const CLOUDINARY_API_ORIGIN = 'https://api.cloudinary.com';
const CLOUDINARY_API_VERSION = 'v1_1';
const CLOUDINARY_UPLOAD_RESOURCE_TYPE = 'auto';

export const buildCloudinaryUploadUrl = (cloudName: string): string =>
  `${CLOUDINARY_API_ORIGIN}/${CLOUDINARY_API_VERSION}/${cloudName}/${CLOUDINARY_UPLOAD_RESOURCE_TYPE}/upload`;
