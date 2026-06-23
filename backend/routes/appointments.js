import express from 'express';
import {
  createAppointment,
  createPublicBooking,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getCalendarAppointments,
  generateAppointmentConfirmationLink,
  getPublicBookingAvailability,
  getPublicRescheduleOptions,
  submitAppointmentConfirmation,
  updateAppointmentAttendanceStatus,
  updateAppointmentConfirmationHandled,
  updateAppointmentRescheduleRequest,
} from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { confirmationLimiter, publicBookingLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  createPublicBookingSchema,
  createAppointmentSchema,
  publicBookingAvailabilitySchema,
  submitAppointmentConfirmationSchema,
  updateAppointmentSchema,
  updateAttendanceStatusSchema,
  updateConfirmationHandledSchema,
  updateRescheduleRequestSchema,
} from '../validators/appointmentValidator.js';

const router = express.Router();

router.get('/public-booking/availability', publicBookingLimiter, validate(publicBookingAvailabilitySchema), getPublicBookingAvailability);
router.post('/public-booking', publicBookingLimiter, validate(createPublicBookingSchema), createPublicBooking);
router.get('/public-reschedule-options/:token', confirmationLimiter, getPublicRescheduleOptions);
router.post('/confirm/:token', confirmationLimiter, validate(submitAppointmentConfirmationSchema), submitAppointmentConfirmation);

router.use(authenticate);

router.post('/', authorize('doctor', 'admin', 'receptionist'), validate(createAppointmentSchema), createAppointment);
router.post('/:id/confirmation-link', authorize('doctor', 'admin', 'receptionist'), generateAppointmentConfirmationLink);
router.patch('/:id/attendance-status', authorize('doctor', 'admin'), validate(updateAttendanceStatusSchema), updateAppointmentAttendanceStatus);
router.patch('/:id/confirmation-handled', authorize('doctor', 'admin', 'receptionist'), validate(updateConfirmationHandledSchema), updateAppointmentConfirmationHandled);
router.patch('/:id/reschedule-request', authorize('doctor', 'admin', 'receptionist'), validate(updateRescheduleRequestSchema), updateAppointmentRescheduleRequest);
router.get('/', authorize('doctor', 'admin', 'receptionist'), getAppointments);
router.get('/calendar', authorize('doctor', 'admin', 'receptionist'), getCalendarAppointments);
router.get('/:id', authorize('doctor', 'admin', 'receptionist'), getAppointment);
router.put('/:id', authorize('doctor', 'admin', 'receptionist'), validate(updateAppointmentSchema), updateAppointment);
router.delete('/:id', authorize('doctor', 'admin', 'receptionist'), deleteAppointment);

export default router;
