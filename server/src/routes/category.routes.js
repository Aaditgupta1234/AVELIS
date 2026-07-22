import { Router } from 'express';
import { getCategories } from '../controllers/category.controller.js';

const router = Router();

// GET /api/v1/categories
router.get('/', getCategories);

export default router;
