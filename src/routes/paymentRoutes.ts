import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/create-intent', protect, paymentController.createPaymentIntent);
router.post('/webhook', paymentController.stripeWebhook);
export default router;