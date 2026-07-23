import { Router } from 'express';
import {
  getBundles,
  createBundle,
  updateBundle,
  deleteBundle
} from '../services/bundle.service.js';

const router = Router();

// GET /api/v1/bundles - Public route for members & visitors
router.get('/', async (req, res) => {
  try {
    const data = await getBundles();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/bundles - Admin route to create a bundle
router.post('/', async (req, res) => {
  try {
    const newBundle = await createBundle(req.body);
    res.status(201).json({ success: true, data: newBundle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/bundles/:id - Admin route to update a bundle
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateBundle(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/bundles/:id - Admin route to delete a bundle
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteBundle(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
