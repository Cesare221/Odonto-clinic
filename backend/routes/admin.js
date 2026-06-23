import express from 'express';
import { exportBackup, createDoctorCesar } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/backup', exportBackup);
router.post('/create-doctor-cesar', createDoctorCesar);

export default router;
