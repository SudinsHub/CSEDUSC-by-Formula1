import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as galleryController from './gallery.controller.js';
import { createGallerySchema, updateGallerySchema } from './gallery.schema.js';

const router = Router();

const EC_ADMIN = ['ECMember', 'Administrator'];

// Public routes
router.get('/', galleryController.list);
router.get('/:id', galleryController.getById);

// EC/Admin routes
router.post('/', requireRole(EC_ADMIN), validate(createGallerySchema), galleryController.create);
router.patch('/:id', requireRole(EC_ADMIN), validate(updateGallerySchema), galleryController.update);
router.delete('/:id', requireRole(EC_ADMIN), galleryController.remove);

export default router;
