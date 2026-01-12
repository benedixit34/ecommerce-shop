import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import sharp from 'sharp'
import { ValidateImageOptions } from '../types';


export const validateSingleImage = (fieldName: string = 'image') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError(`Please upload a ${fieldName}`, 400));
    }


    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return next(new AppError('File size should not exceed 5MB', 400));
    }


    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(new AppError('Only JPEG, PNG, WebP, and AVIF images are allowed', 400));
    }

    next();
  };
};


export const validateMultipleImages = (options?: {
  min?: number;
  max?: number;
  fieldName?: string;
}) => {
  const { min = 1, max = 5, fieldName = 'images' } = options || {};

  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next(new AppError(`Please upload at least ${min} ${fieldName}`, 400));
    }

    if (files.length < min) {
      return next(new AppError(`Please upload at least ${min} ${fieldName}`, 400));
    }

    if (files.length > max) {
      return next(new AppError(`Maximum ${max} ${fieldName} allowed`, 400));
    }

  
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

    for (const file of files) {
      if (file.size > maxSize) {
        return next(new AppError(`Each file should not exceed 5MB`, 400));
      }

      if (!allowedTypes.includes(file.mimetype)) {
        return next(new AppError('Only JPEG, PNG, WebP, and AVIF images are allowed', 400));
      }
    }

    next();
  };
};



export const validateImageDimensions = (options: ValidateImageOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        return next();
      }

  
      const imageBuffer = file.buffer ?? file.path;

      const metadata = await sharp(imageBuffer).metadata();

      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (options.minWidth && width < options.minWidth) {
        return next(
          new AppError(`Image width must be at least ${options.minWidth}px`, 400)
        );
      }

      if (options.minHeight && height < options.minHeight) {
        return next(
          new AppError(`Image height must be at least ${options.minHeight}px`, 400)
        );
      }

      if (options.maxWidth && width > options.maxWidth) {
        return next(
          new AppError(`Image width must not exceed ${options.maxWidth}px`, 400)
        );
      }

      if (options.maxHeight && height > options.maxHeight) {
        return next(
          new AppError(`Image height must not exceed ${options.maxHeight}px`, 400)
        );
      }

      next();
    } catch (error) {
      next(new AppError('Invalid image file', 400));
    }
  };
};