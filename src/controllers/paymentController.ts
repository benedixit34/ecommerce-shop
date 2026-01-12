// src/controllers/paymentController.ts
import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import flw from '../config/flutterwave';
import Order from '../models/Order';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest, FlutterwavePayload } from '../types';
import logger from '../utils/logger';

// Initialize payment
export const initializePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.user.toString() !== req.user?.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    if (order.isPaid) {
      return next(new AppError('Order already paid', 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate unique transaction reference
    const tx_ref = `TXN-${order.orderNumber}-${Date.now()}`;

    const payload: FlutterwavePayload = {
      tx_ref,
      amount: order.total,
      currency: 'NGN', // Change based on your currency
      redirect_url: `${process.env.CLIENT_URL}/payment/verify`,
      customer: {
        email: user.email,
        phonenumber: user.phone,
        name: user.name
      },
      customizations: {
        title: 'E-commerce Store',
        description: `Payment for Order ${order.orderNumber}`,
        logo: `${process.env.CLIENT_URL}/logo.png`
      },
      meta: {
        orderId: order._id.toString(),
        userId: user._id.toString()
      }
    };

    const response = await flw.Charge.card(payload);

    if (response.status === 'success') {
      res.json({
        success: true,
        data: {
          link: response.meta.authorization.redirect,
          tx_ref,
          orderId: order._id
        }
      });
    } else {
      return next(new AppError('Payment initialization failed', 400));
    }
  } catch (err: any) {
    logger.error('Payment initialization error:', err);
    next(new AppError(err.message || 'Payment initialization failed', 500));
  }
};

// Verify payment
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { transaction_id, tx_ref } = req.query;

    if (!transaction_id) {
      return next(new AppError('Transaction ID is required', 400));
    }

    // Verify transaction with Flutterwave
    const response = await flw.Transaction.verify({ id: transaction_id as string });

    if (
      response.data.status === 'successful' &&
      response.data.amount >= 0 &&
      response.data.currency === 'NGN'
    ) {
      // Extract order ID from meta
      const orderId = response.data.meta?.orderId;

      if (!orderId) {
        return next(new AppError('Order ID not found in transaction', 400));
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      // Check if order amount matches
      if (response.data.amount !== order.total) {
        logger.error('Amount mismatch:', {
          expected: order.total,
          received: response.data.amount
        });
        return next(new AppError('Payment amount mismatch', 400));
      }

      // Update order
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'processing';
      order.paymentResult = {
        transactionId: response.data.id.toString(),
        flwRef: response.data.flw_ref,
        status: response.data.status,
        processor: response.data.payment_type,
        amount: response.data.amount,
        currency: response.data.currency
      };

      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: order
      });
    } else {
      return next(new AppError('Payment verification failed', 400));
    }
  } catch (err: any) {
    logger.error('Payment verification error:', err);
    next(new AppError(err.message || 'Payment verification failed', 500));
  }
};

// Webhook handler
export const flutterwaveWebhook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secretHash) {
      logger.warn('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const payload = req.body;

    // Only handle successful payments
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const orderId = payload.data.meta?.orderId;

      if (!orderId) {
        logger.error('Order ID not found in webhook payload');
        return res.status(200).send('OK');
      }

      const order = await Order.findById(orderId);

      if (!order) {
        logger.error('Order not found:', orderId);
        return res.status(200).send('OK');
      }

      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing';
        order.paymentResult = {
          transactionId: payload.data.id.toString(),
          flwRef: payload.data.flw_ref,
          status: payload.data.status,
          processor: payload.data.payment_type,
          amount: payload.data.amount,
          currency: payload.data.currency
        };

        await order.save();

        logger.info('Order payment confirmed via webhook:', {
          orderId: order._id,
          orderNumber: order.orderNumber
        });

        // TODO: Send confirmation email to customer
        // await sendOrderConfirmation(order, user);
      }
    }

    res.status(200).send('OK');
  } catch (err: any) {
    logger.error('Webhook error:', err);
    res.status(500).send('Webhook processing failed');
  }
};

// Get payment methods
export const getPaymentMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'card',
          name: 'Card Payment',
          description: 'Pay with Visa, Mastercard, Verve',
          icon: 'credit-card'
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Transfer from your bank account',
          icon: 'bank'
        },
        {
          id: 'ussd',
          name: 'USSD',
          description: 'Pay via USSD code',
          icon: 'phone'
        },
        {
          id: 'mobile_money',
          name: 'Mobile Money',
          description: 'Pay with mobile money',
          icon: 'mobile'
        }
      ]
    }
  });
};

// Get transaction history for user
export const getTransactionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({
      user: req.user?.id,
      isPaid: true
    })
      .select('orderNumber total paymentResult paidAt status')
      .skip(skip)
      .limit(limit)
      .sort('-paidAt');

    const total = await Order.countDocuments({
      user: req.user?.id,
      isPaid: true
    });

    res.json({
      success: true,
      data: orders,
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

// Refund payment (admin only)
export const refundPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (!order.isPaid) {
      return next(new AppError('Order not paid yet', 400));
    }

    if (!order.paymentResult?.flwRef) {
      return next(new AppError('Payment reference not found', 400));
    }

    // Initiate refund with Flutterwave
    const payload = {
      id: order.paymentResult.transactionId,
      amount: amount || order.total
    };

    const response = await flw.Transaction.refund(payload);

    if (response.status === 'success') {
      order.status = 'cancelled';
      order.notes = `Refund initiated: ${response.data.status}`;
      await order.save();

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: response.data
      });
    } else {
      return next(new AppError('Refund failed', 400));
    }
  } catch (err: any) {
    logger.error('Refund error:', err);
    next(new AppError(err.message || 'Refund failed', 500));
  }
};