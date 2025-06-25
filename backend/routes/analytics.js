import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard overview analytics
// @route   GET /api/analytics/overview
// @access  Private
router.get('/overview', protect, async (req, res, next) => {
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

    // Get basic stats
    const [orderStats, productStats, transactionStats, reviewStats] = await Promise.all([
      // Order statistics
      Order.aggregate([
        {
          $match: {
            seller: req.user._id,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),

      // Product statistics
      Product.aggregate([
        {
          $match: { seller: req.user._id }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            lowStockProducts: {
              $sum: {
                $cond: [
                  { $lte: ['$stock', '$lowStockThreshold'] },
                  1,
                  0
                ]
              }
            },
            totalViews: { $sum: '$analytics.views' },
            totalSales: { $sum: '$analytics.sales' }
          }
        }
      ]),

      // Transaction statistics
      Transaction.aggregate([
        {
          $match: {
            seller: req.user._id,
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Review statistics
      Review.aggregate([
        {
          $match: {
            seller: req.user._id,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    // Calculate growth rates (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    const periodDuration = new Date() - startDate;
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const previousOrderStats = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const currentStats = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0
    };

    const previousStats = previousOrderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0
    };

    // Calculate growth percentages
    const orderGrowth = previousStats.totalOrders > 0 
      ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
      : 0;

    const revenueGrowth = previousStats.totalRevenue > 0
      ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        orders: {
          ...currentStats,
          orderGrowth: Math.round(orderGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100
        },
        products: productStats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalViews: 0,
          totalSales: 0
        },
        transactions: transactionStats,
        reviews: reviewStats[0] || {
          totalReviews: 0,
          averageRating: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private
router.get('/sales', protect, async (req, res, next) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    let startDate = new Date();
    let groupFormat;

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        groupFormat = groupBy === 'week' 
          ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
          : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          status: { $in: ['delivered', 'shipped', 'processing'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          status: { $in: ['delivered', 'shipped', 'processing'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          status: { $in: ['delivered', 'shipped', 'processing'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          sales: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        salesData,
        topProducts,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get product analytics
// @route   GET /api/analytics/products
// @access  Private
router.get('/products', protect, async (req, res, next) => {
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

    // Get product performance
    const productPerformance = await Product.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          stock: 1,
          views: '$analytics.views',
          sales: '$analytics.sales',
          revenue: '$analytics.revenue',
          conversionRate: '$analytics.conversionRate',
          status: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Get inventory alerts
    const inventoryAlerts = await Product.find({
      seller: req.user.id,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).select('name stock lowStockThreshold category');

    // Get category performance
    const categoryPerformance = await Product.aggregate([
      {
        $match: { seller: req.user._id }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalSales: { $sum: '$analytics.sales' },
          totalRevenue: { $sum: '$analytics.revenue' },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        productPerformance,
        inventoryAlerts,
        categoryPerformance
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private
router.get('/customers', protect, async (req, res, next) => {
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

    // Get customer insights
    const customerInsights = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$customer.email',
          customerName: { $first: '$customer.name' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 50 }
    ]);

    // Get new vs returning customers
    const customerTypes = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$customer.email',
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          newCustomers: {
            $sum: { $cond: [{ $eq: ['$orderCount', 1] }, 1, 0] }
          },
          returningCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        customerInsights,
        customerTypes: customerTypes[0] || { newCustomers: 0, returningCustomers: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;