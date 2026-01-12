import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';


const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary environment variables are missing');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const createUploader = (maxSizeMB: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: imageFilter,
  });

export const uploadProductImages = createUploader(5);   // multiple images
export const uploadAvatar = createUploader(2);
export const uploadCategoryImage = createUploader(3);


type UploadOptions = {
  folder: string;
  transformation?: any;
  publicId?: string;
};

const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  options: UploadOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'image',
        quality: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload failed'));
        resolve(result);
      }
    ).end(file.buffer);
  });
};


export const uploadProductImage = (file: Express.Multer.File) =>
  uploadBufferToCloudinary(file, {
    folder: 'ecommerce/products',
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  });

export const uploadMultipleProductImages = async (
  files: Express.Multer.File[]
): Promise<UploadApiResponse[]> =>
  Promise.all(files.map(file => uploadProductImage(file)));

export const uploadAvatarImage = (file: Express.Multer.File) =>
  uploadBufferToCloudinary(file, {
    folder: 'ecommerce/avatars',
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
    ],
  });

export const uploadCategoryImageToCloudinary = (file: Express.Multer.File) =>
  uploadBufferToCloudinary(file, {
    folder: 'ecommerce/categories',
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  });


export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const deleteImages = async (publicIds: string[]): Promise<void> => {
  if (!publicIds.length) return;
  await cloudinary.api.delete_resources(publicIds);
};

export default cloudinary;
