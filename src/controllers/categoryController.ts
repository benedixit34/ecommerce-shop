import { Response, NextFunction } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name')
      .sort('name');

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

export const getCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id).populate('parent');
    
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const subcategories = await Category.find({ parent: category._id });

    res.json({ 
      success: true, 
      data: { ...category.toObject(), subcategories } 
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return next(new AppError('Cannot delete category with products', 400));
    }

    const subcategoryCount = await Category.countDocuments({ parent: category._id });
    if (subcategoryCount > 0) {
      return next(new AppError('Cannot delete category with subcategories', 400));
    }

    await category.deleteOne();

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
