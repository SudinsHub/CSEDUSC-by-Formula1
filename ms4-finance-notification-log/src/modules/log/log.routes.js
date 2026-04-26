import express from 'express';
import { logController } from './log.controller.js';
import { validate } from '../../middleware/validate.js';
import { listLogsSchema } from '../budget/budget.schema.js';

const router = express.Router();

router.get('/', listLogsSchema, validate, logController.list);

export default router;
