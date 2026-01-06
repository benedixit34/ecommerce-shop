import { Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let cart = await Cart.findOne({ user: req.user?.id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user?.id, items: [] });
    }

    const total = cart.items.reduce((sum, item: any) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    cart.total = total;
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.inventory.quantity < quantity) {
      return next(new AppError('Insufficient inventory', 400));
    }

    let cart = await Cart.findOne({ user: req.user?.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user?.id,
        items: [{ product: productId, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item: any) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    cart = await cart.populate('items.product');

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user?.id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return next(new AppError('Item not in cart', 404));
    }

    const product = await Product.findById(productId);
    if (!product || product.inventory.quantity < quantity) {
      return next(new AppError('Insufficient inventory', 400));
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user?.id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(
      (item: any) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product');

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await Cart.findOne({ user: req.user?.id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}