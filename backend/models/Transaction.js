import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['sale', 'refund', 'fee', 'payout', 'adjustment', 'chargeback'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'wallet']
  },
  paymentDetails: {
    transactionId: String,
    paymentIntentId: String,
    chargeId: String,
    last4: String,
    brand: String,
    gateway: String
  },
  fees: {
    platform: {
      type: Number,
      default: 0
    },
    payment: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  netAmount: {
    type: Number,
    required: true
  },
  metadata: {
    source: String,
    reference: String,
    notes: String
  },
  processedAt: Date,
  settledAt: Date,
  failureReason: String,
  refundDetails: {
    originalTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    reason: String,
    refundId: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ 'paymentDetails.transactionId': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Method to mark as completed
transactionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

// Static method to get transaction summary
transactionSchema.statics.getTransactionSummary = function(sellerId, startDate, endDate) {
  const matchStage = {
    seller: new mongoose.Types.ObjectId(sellerId),
    status: 'completed',
    createdAt: { $gte: startDate, $lte: endDate }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.total' },
        netAmount: { $sum: '$netAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get daily revenue
transactionSchema.statics.getDailyRevenue = function(sellerId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        seller: new mongoose.Types.ObjectId(sellerId),
        type: 'sale',
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$netAmount' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

export default mongoose.model('Transaction', transactionSchema);