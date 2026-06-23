// =============================================================================
// CONTROLLERS/PATIENTCONTROLLER.JS - BACKEND - Patient CRUD Logic
// =============================================================================

import Patient from '../models/Patient.js';
import { asyncHandler } from '../utils/apiError.js';
import { applyToothUpdates } from '../utils/patientOdontogram.js';

/**
 * @desc    Create new patient
 * @route   POST /api/patients
 * @access  Private (doctor, admin, receptionist)
 */
export const createPatient = asyncHandler(async (req, res) => {
  const patientData = {
    ...req.body,
    createdBy: req.user.userId,
  };

  const patient = await Patient.create(patientData);

  res.status(201).json({
    status: 'success',
    data: patient,
  });
});

/**
 * @desc    Get all patients with pagination and search
 * @route   GET /api/patients
 * @access  Private
 */
export const getPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const query = {};

  if (search.trim()) {
    query.$text = { $search: search };
  }

  const patients = await Patient.find(query)
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Patient.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      patients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    },
  });
});

/**
 * @desc    Get single patient
 * @route   GET /api/patients/:id
 * @access  Private
 */
export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('treatmentHistory')
    .populate('createdBy', 'name email');

  if (!patient) {
    return res.status(404).json({
      status: 'error',
      message: 'Paciente não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!patient) {
    return res.status(404).json({
      status: 'error',
      message: 'Paciente não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

/**
 * @desc    Delete patient (soft delete)
 * @route   DELETE /api/patients/:id
 * @access  Private
 */
export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!patient) {
    return res.status(404).json({
      status: 'error',
      message: 'Paciente não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Paciente removido com sucesso (soft delete).',
  });
});

/**
 * @desc    Update patient odontogram
 * @route   PUT /api/patients/:id/odontogram
 * @access  Private (doctor only)
 */
export const updateOdontogram = asyncHandler(async (req, res) => {
  const { tooth, status, note } = req.body;

  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      status: 'error',
      message: 'Paciente não encontrado.',
    });
  }

  applyToothUpdates(patient, [{ tooth, status, note }]);

  await patient.save();

  res.status(200).json({
    status: 'success',
    data: patient,
  });
});
