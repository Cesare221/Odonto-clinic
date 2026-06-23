// =============================================================================
// ROUTES/TRANSACTIONS.JS - BACKEND - Financial transactions routes
// =============================================================================

import express from 'express';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getFinancialStats
} from '../controllers/transactionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('doctor', 'admin'), createTransaction);
router.get('/', authorize('doctor', 'admin'), getTransactions);
router.get('/stats', authorize('doctor', 'admin'), getFinancialStats);
router.put('/:id', authorize('doctor', 'admin'), updateTransaction);
router.delete('/:id', authorize('admin'), deleteTransaction);

export default router;
