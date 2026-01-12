import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';
import { deleteImages } from '../config/cloudinary';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };
    
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice as string);
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort((req.query.sort as string) || '-createdAt');

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const images = files?.map(file => ({
      url: file.path,
      publicId: (file as any).filename
    })) || [];
    const productData = {
      ...req.body,
      images
    };
    const product = await Product.create(productData);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const newImages = files.map(file => ({
        url: file.path,
        publicId: (file as any).filename
      }));

        if (req.body.replaceImages === 'true') {
        const oldPublicIds = product.images.map(img => img.publicId).filter(Boolean) as string[];
        if (oldPublicIds.length > 0) {
          await deleteImages(oldPublicIds);
        }
        product.images = newImages;
      } else {
        product.images.push(...newImages);
      }

    }
    Object.assign(product, req.body);
    await product.save();

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    const publicIds = product.images.map(img => img.publicId).filter(Boolean) as string[];
    if (publicIds.length > 0) {
      await deleteImages(publicIds);
    }
    await product.deleteOne()
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};


export const deleteProductImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const imageIndex = product.images.findIndex(img => img?._id?.toString() === imageId);
    if (imageIndex === -1) {
      return next(new AppError('Image not found', 404));
    }

    const imageToDelete = product.images[imageIndex];
    if (imageToDelete.publicId) {
      await deleteImages([imageToDelete.publicId]);
    }

    product.images.splice(imageIndex, 1);
    await product.save();

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};