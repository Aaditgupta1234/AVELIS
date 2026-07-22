import { Router } from 'express';
import { getAuthors } from '../controllers/author.controller.js';

const router = Router();

// GET /api/v1/authors
router.get('/', getAuthors);

export default router;
