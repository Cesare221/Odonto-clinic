// =============================================================================
// CONTROLLERS/TREATMENTCONTROLLER.JS - BACKEND - Treatment Sessions Logic
// =============================================================================

import TreatmentSession from '../models/TreatmentSession.js';
import Patient from '../models/Patient.js';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/apiError.js';
import { applyToothUpdates } from '../utils/patientOdontogram.js';

/**
 * @desc    Create new treatment session
 * @route   POST /api/treatments
 * @access  Private (doctor)
 */
export const createTreatmentSession = asyncHandler(async (req, res) => {
  const session = await TreatmentSession.create({
    ...req.body,
    doctor: req.user.userId,
  });

  res.status(201).json({
    status: 'success',
    data: session,
  });
});

/**
 * @desc    Get all treatment sessions
 * @route   GET /api/treatments
 * @access  Private
 */
export const getTreatmentSessions = asyncHandler(async (req, res) => {
  const { patient, doctor, page = 1, limit = 20 } = req.query;

  const query = {};
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  const sessions = await TreatmentSession.find(query)
    .populate('patient', 'name cpf')
    .populate('doctor', 'name email')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({
    status: 'success',
    data: sessions,
  });
});

/**
 * @desc    Get single treatment session
 * @route   GET /api/treatments/:id
 * @access  Private
 */
export const getTreatmentSession = asyncHandler(async (req, res) => {
  const session = await TreatmentSession.findById(req.params.id)
    .populate('patient', 'name cpf phone email')
    .populate('doctor', 'name email');

  if (!session) {
    return res.status(404).json({
      status: 'error',
      message: 'Sessão de atendimento não encontrada.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: session,
  });
});

/**
 * @desc    Update treatment session (e.g., complete it)
 * @route   PUT /api/treatments/:id
 * @access  Private (doctor who created it)
 */
export const updateTreatmentSession = asyncHandler(async (req, res) => {
  const session = await TreatmentSession.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!session) {
    return res.status(404).json({
      status: 'error',
      message: 'Sessão de atendimento não encontrada.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: session,
  });
});

/**
 * @desc    Finalize treatment session and create financial record
 * @route   POST /api/treatments/:id/finalize
 * @access  Private (doctor)
 */
export const finalizeTreatmentSession = asyncHandler(async (req, res) => {
  const {
    totalValue,
    procedures,
    paymentMethod,
    teethUpdates = [],
    anamnesis = [],
    evolution = '',
    postOpInstructions = '',
  } = req.body;

  const session = await TreatmentSession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      status: 'error',
      message: 'Sessão de atendimento não encontrada.',
    });
  }

  session.status = 'completed';
  session.totalValue = totalValue;
  session.procedures = procedures;
  session.teethUpdates = teethUpdates;
  session.anamnesis = anamnesis;
  session.evolution = evolution;
  session.postOpInstructions = postOpInstructions;
  await session.save();

  await Transaction.create({
    description: `Atendimento - ${session.procedures.map((procedure) => procedure.procedure).join(', ')}`,
    value: totalValue,
    type: 'receita',
    date: new Date(),
    patient: session.patient,
    treatmentSession: session._id,
    registeredBy: req.user.userId,
    paymentMethod: paymentMethod || 'other',
  });

  const patient = await Patient.findById(session.patient);

  if (patient) {
    if (!Array.isArray(patient.treatmentHistory)) {
      patient.treatmentHistory = [];
    }

    if (!patient.treatmentHistory.some((historyId) => String(historyId) === String(session._id))) {
      patient.treatmentHistory.push(session._id);
    }

    applyToothUpdates(patient, teethUpdates);

    patient.lastVisit = new Date();

    if (evolution) {
      patient.dentalNotes = evolution;
    }

    await patient.save();
  }

  res.status(200).json({
    status: 'success',
    data: session,
  });
});
