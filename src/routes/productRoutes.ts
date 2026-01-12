import { Router } from 'express';
import * as productController from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { uploadProductImages } from '../config/cloudinary';
import { validateMultipleImages, validateImageDimensions } from '../middleware/imageValidation';

const router = Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadProductImages.array('images', 5),
  validateMultipleImages({ min: 1, max: 5, fieldName: 'product images' }), 
  validateImageDimensions({ minWidth: 500, minHeight: 500 }),
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadProductImages.array('images', 5),
  validateMultipleImages({ min: 0, max: 5, fieldName: 'product images' }),
  productController.updateProduct
);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

router.delete(
  '/:id/images/:imageId',
  protect,
  authorize('admin'),
  productController.deleteProductImage
);


export default router;