import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, cartController.getCart);
router.post('/items', protect, cartController.addToCart);
router.put('/items/:productId', protect, cartController.updateCartItem);
router.delete('/items/:productId', protect, cartController.removeFromCart);
router.delete('/', protect, cartController.clearCart);

export default router;