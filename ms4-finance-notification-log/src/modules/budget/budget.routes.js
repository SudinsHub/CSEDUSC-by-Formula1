import express from 'express';
import { budgetController } from './budget.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  submitBudgetSchema,
  budgetIdSchema,
  approveBudgetSchema,
  rejectBudgetSchema,
  recordExpenditureSchema,
} from './budget.schema.js';

const router = express.Router();

router.post('/', submitBudgetSchema, validate, budgetController.submit);
router.get('/', budgetController.list);
router.get('/:id', budgetIdSchema, validate, budgetController.getById);
router.patch('/:id/approve', approveBudgetSchema, validate, budgetController.approve);
router.patch('/:id/reject', rejectBudgetSchema, validate, budgetController.reject);
router.post('/:id/expenditures', recordExpenditureSchema, validate, budgetController.recordExpenditure);
router.get('/:id/expenditures', budgetIdSchema, validate, budgetController.listExpenditures);

export default router;
