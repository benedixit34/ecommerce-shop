import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Cart from '../models/Cart';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await Cart.findOne({ user: req.user?.id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    const orderItems = cart.items.map((item: any) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0]?.url
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const shippingFee = subtotal > 100 ? 0 : 10;
    const total = subtotal + tax + shippingFee;

    const order = await Order.create({
      user: req.user?.id,
      items: orderItems,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      subtotal,
      tax,
      shippingFee,
      total
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate((item as any).product._id, {
        $inc: { 'inventory.quantity': -item.quantity }
      });
    }

    await Cart.findByIdAndDelete(cart._id);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.user?.role === 'admin' ? {} : { user: req.user?.id };
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt');
    
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.user._id.toString() !== req.user?.id.toString() && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
