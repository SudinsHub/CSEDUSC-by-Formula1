import express from 'express';
import { logController } from './log.controller.js';
import { validate } from '../../middleware/validate.js';
import { listLogsSchema, deleteLogsSchema } from './log.schema.js';

const router = express.Router();

router.get('/', listLogsSchema, validate, logController.list);
router.delete('/', deleteLogsSchema, validate, logController.delete);

export default router;
