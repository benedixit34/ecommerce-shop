import { Response, NextFunction } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export const getProductReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ product: productId });

    res.json({
      success: true,
      data: reviews,
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

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, rating, title, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const order = await Order.findOne({
      user: req.user?.id,
      'items.product': productId,
      status: 'delivered'
    });

    const verified = !!order;

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user?.id
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this product', 400));
    }

    const review = await Review.create({
      product: productId,
      user: req.user?.id,
      rating,
      title,
      comment,
      verified
    });

    await updateProductRating(productId);

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    if (review.user.toString() !== req.user?.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    const { rating, title, comment } = req.body;
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;

    await review.save();
    await updateProductRating(review.product);

    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    if (review.user.toString() !== req.user?.id.toString() && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

async function updateProductRating(productId: any): Promise<void> {
  const reviews = await Review.find({ product: productId });
  
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count': 0
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = totalRating / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    'rating.average': Math.round(average * 10) / 10,
    'rating.count': reviews.length
  });
}