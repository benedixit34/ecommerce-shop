import { Response, NextFunction } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import{ AppError }from '../utils/AppError';
import { AuthRequest } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.user.toString() !== req.user?.id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user.id.toString()
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: order.total
      }
    });
  } catch (err) {
    next(err);
  }
};

export const stripeWebhook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: new Date(),
      'paymentResult.id': paymentIntent.id,
      'paymentResult.status': paymentIntent.status
    });
  }

  res.json({ received: true });
};

export const getStripeConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
};
