// =============================================================================
// ROUTES/PATIENTS.JS - BACKEND - Patient management routes
// =============================================================================

import express from 'express';
import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  updateOdontogram
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patientValidator.js';

const router = express.Router();

// Todas as rotas abaixo requerem autenticação
router.use(authenticate);

router.post('/', authorize('doctor', 'admin', 'receptionist'), validate(createPatientSchema), createPatient);
router.get('/', getPatients);
router.get('/:id', getPatient);
router.put('/:id', authorize('doctor', 'admin'), validate(updatePatientSchema), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);
router.put('/:id/odontogram', authorize('doctor', 'admin'), updateOdontogram);

export default router;
