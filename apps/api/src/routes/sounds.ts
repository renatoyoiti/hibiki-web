import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { soundService } from '../services/soundService';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'sounds');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /api/sounds
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await soundService.list();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/sounds/upload
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(422).json({
          error: {
            code: 'INVALID_FILE_FORMAT',
            message: 'Nenhum arquivo enviado.',
            statusCode: 422,
          },
        });
        return;
      }

      const sound = await soundService.upload(req.file, req.body.name);
      res.status(201).json(sound);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/sounds/:id/favorite
router.patch(
  '/:id/favorite',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sound = await soundService.toggleFavorite(req.params.id as string);
      res.json(sound);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/sounds/:id
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await soundService.softDelete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;

