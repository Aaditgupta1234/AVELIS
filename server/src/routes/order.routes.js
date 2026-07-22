import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);

export default router;
