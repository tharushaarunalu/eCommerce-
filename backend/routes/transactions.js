import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all transactions for seller
// @route   GET /api/transactions
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { seller: req.user.id };

    // Add filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('order', 'orderNumber customer.name');

    const total = await Transaction.countDocuments(query);

    // Get transaction summary
    const summary = await Transaction.aggregate([
      { $match: { seller: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      summary,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      seller: req.user.id
    }).populate('order', 'orderNumber customer items pricing');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
router.get('/summary/stats', protect, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const summary = await Transaction.getTransactionSummary(
      req.user.id,
      startDate,
      new Date()
    );

    const dailyRevenue = await Transaction.getDailyRevenue(req.user.id, 30);

    // Calculate totals
    const totals = summary.reduce((acc, item) => {
      acc.totalAmount += item.totalAmount;
      acc.totalFees += item.totalFees;
      acc.netAmount += item.netAmount;
      acc.totalTransactions += item.count;
      return acc;
    }, {
      totalAmount: 0,
      totalFees: 0,
      netAmount: 0,
      totalTransactions: 0
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        totals,
        dailyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create transaction (for testing/manual entries)
// @route   POST /api/transactions
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      seller: req.user.id
    };

    // Calculate net amount if not provided
    if (!transactionData.netAmount) {
      const fees = transactionData.fees?.total || 0;
      transactionData.netAmount = transactionData.amount - fees;
    }

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, failureReason } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (status === 'completed') {
      await transaction.markCompleted();
    } else if (status === 'failed') {
      await transaction.markFailed(failureReason);
    } else {
      transaction.status = status;
      await transaction.save();
    }

    res.status(200).json({
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

export default router;