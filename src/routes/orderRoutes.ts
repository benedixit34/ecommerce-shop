import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);

export default router;