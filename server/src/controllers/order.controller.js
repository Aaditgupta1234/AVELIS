import * as orderService from '../services/order.service.js';
import { ApiResponse } from '../utils/index.js';

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress } = req.body;
    const order = await orderService.createOrder({ userId, items, shippingAddress });
    return res.status(201).json(new ApiResponse(201, order, 'Order created successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await orderService.getMyOrders({ userId });
    return res.status(200).json(new ApiResponse(200, orders, 'Orders retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};
