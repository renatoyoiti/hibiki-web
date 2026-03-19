import { Router, Request, Response, NextFunction } from 'express';
import { presetService } from '../services/presetService';
import { AppError } from '../lib/errors';

const router = Router();

// GET /api/presets
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await presetService.list();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/presets/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preset = await presetService.findById(req.params.id as string);
    res.json(preset);
  } catch (err) {
    next(err);
  }
});

// POST /api/presets
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sounds } = req.body as {
      name?: string;
      sounds?: Array<{ soundId: string; volume: number }>;
    };

    if (!name?.trim()) {
      throw new AppError('VALIDATION_ERROR', 'O campo "name" é obrigatório.', 422);
    }

    const preset = await presetService.create(name.trim(), sounds ?? []);
    res.status(201).json(preset);
  } catch (err) {
    next(err);
  }
});

// PUT /api/presets/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sounds } = req.body as {
      name?: string;
      sounds?: Array<{ soundId: string; volume: number }>;
    };

    const preset = await presetService.update(req.params.id as string, { name, sounds });
    res.json(preset);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/presets/:id
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await presetService.softDelete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;

