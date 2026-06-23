// =============================================================================
// ROUTES/TREATMENTS.JS - BACKEND - Treatment sessions routes
// =============================================================================

import express from 'express';
import {
  createTreatmentSession,
  getTreatmentSessions,
  getTreatmentSession,
  updateTreatmentSession,
  finalizeTreatmentSession
} from '../controllers/treatmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('doctor', 'admin'), createTreatmentSession);
router.get('/', getTreatmentSessions);
router.get('/:id', getTreatmentSession);
router.put('/:id', authorize('doctor', 'admin'), updateTreatmentSession);
router.post('/:id/finalize', authorize('doctor', 'admin'), finalizeTreatmentSession);

export default router;
