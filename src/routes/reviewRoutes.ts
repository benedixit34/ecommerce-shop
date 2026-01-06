import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', protect, reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

export default router;