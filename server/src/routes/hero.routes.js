import express from 'express';
import { getHeroSettings, saveHeroSettings } from '../services/hero.service.js';

const router = express.Router();

// GET /api/v1/hero - Public route for members, visitors, and admins
router.get('/', async (req, res, next) => {
  try {
    const data = await getHeroSettings();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hero - Admin route to save hero showcase banner settings
router.post('/', async (req, res, next) => {
  try {
    const updated = await saveHeroSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
