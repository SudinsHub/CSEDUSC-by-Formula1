import { Router } from 'express';
import multer from 'multer';
import { requireRole } from '../../middleware/requireRole.js';
import * as mediaController from './media.controller.js';
import { config } from '../../config.js';

const router = Router();

const EC_ADMIN = ['ECMember', 'Administrator'];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Temporary storage, will be moved by fileStorageService
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSizeMB * 1024 * 1024, // Convert MB to bytes
  },
});

// Public routes
router.get('/', mediaController.list);
router.get('/:id/file', mediaController.streamFile);

// EC/Admin routes
router.post('/upload', requireRole(EC_ADMIN), upload.single('file'), mediaController.upload);

export default router;
