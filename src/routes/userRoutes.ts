import { Router } from 'express';
import * as userController from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.updatePassword);
router.post('/address', protect, userController.addAddress);
router.put('/address/:addressId', protect, userController.updateAddress);
router.delete('/address/:addressId', protect, userController.deleteAddress);

router.get('/', protect, authorize('admin'), userController.getUsers);
router.get('/:id', protect, authorize('admin'), userController.getUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

export default router;