// =============================================================================
// CONTROLLERS/TRANSACTIONCONTROLLER.JS - BACKEND - Financial Transactions
// =============================================================================

import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/apiError.js';

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private (doctor, admin)
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({
    ...req.body,
    registeredBy: req.user.userId
  });

  res.status(201).json({
    status: 'success',
    data: transaction
  });
});

/**
 * @desc    Get all transactions with filters
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, page = 1, limit = 50 } = req.query;

  const query = {
    registeredBy: req.user.userId,
  }; // User can only see their transactions

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (type) query.type = type;

  const transactions = await Transaction.find(query)
    .populate('patient', 'name cpf')
    .populate('registeredBy', 'name email')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Transaction.countDocuments(query);

  // Calcula totais
  const stats = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$value' }
      }
    }
  ]);

  const receitas = stats.find(s => s._id === 'receita')?.total || 0;
  const despesas = stats.find(s => s._id === 'despesa')?.total || 0;

  res.status(200).json({
    status: 'success',
    data: {
      transactions,
      stats: {
        receitas,
        despesas,
        saldo: receitas - despesas
      },
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }
  });
});

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return res.status(404).json({
      status: 'error',
      message: 'Transação não encontrada.'
    });
  }

  res.status(200).json({
    status: 'success',
    data: transaction
  });
});

/**
 * @desc    Delete transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private (Admin)
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      status: 'error',
      message: 'Transação não encontrada.'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Transação removida com sucesso.'
  });
});

/**
 * @desc    Get financial dashboard stats
 * @route   GET /api/transactions/stats
 * @access  Private
 */
export const getFinancialStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const stats = await Transaction.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $month: '$date' }
        },
        total: { $sum: '$value' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});
