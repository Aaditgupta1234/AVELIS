import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/', orderController.getAllOrders);
router.patch('/:orderId/cancel', orderController.cancelOrder);

export default router;
