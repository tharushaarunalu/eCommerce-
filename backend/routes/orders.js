import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all orders for seller
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { seller: req.user.id };

    // Add filters
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: orders
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.user.id
    }).populate('items.product', 'name images sku');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, note, req.user.id);

    // Create notification for status update
    await Notification.createNotification({
      recipient: req.user.id,
      type: 'order_update',
      title: 'Order Status Updated',
      message: `Order ${order.orderNumber} status changed to ${status}`,
      data: {
        orderId: order._id,
        url: `/orders/${order._id}`
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`seller-${req.user.id}`).emit('order_updated', {
      orderId: order._id,
      status,
      orderNumber: order.orderNumber
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add tracking information
// @route   PUT /api/orders/:id/tracking
// @access  Private
router.put('/:id/tracking', protect, async (req, res, next) => {
  try {
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.shipping.tracking = {
      number: trackingNumber,
      carrier,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      status: 'in_transit'
    };

    // Update order status to shipped if not already
    if (order.status !== 'shipped') {
      order.status = 'shipped';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Tracking information added successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new order (for testing)
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { customer, items, shipping, paymentMethod } = req.body;

    // Calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        sku: product.sku,
        image: product.primaryImage?.url
      });
    }

    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = shipping?.cost || 0;
    const total = subtotal + tax + shippingCost;

    const order = await Order.create({
      seller: req.user.id,
      customer,
      items: orderItems,
      pricing: {
        subtotal,
        tax,
        shipping: shippingCost,
        total
      },
      shipping,
      paymentMethod,
      paymentStatus: 'paid'
    });

    // Update product stock and analytics
    for (const item of items) {
      const product = await Product.findById(item.productId);
      await product.recordSale(item.quantity, product.price);
    }

    // Create transaction record
    await Transaction.create({
      seller: req.user.id,
      order: order._id,
      type: 'sale',
      amount: total,
      description: `Sale: Order ${order.orderNumber}`,
      status: 'completed',
      paymentMethod,
      netAmount: total * 0.97, // 3% platform fee
      fees: {
        platform: total * 0.03,
        total: total * 0.03
      }
    });

    // Create notification
    await Notification.createNotification({
      recipient: req.user.id,
      type: 'new_order',
      title: 'New Order Received',
      message: `You have received a new order ${order.orderNumber}`,
      data: {
        orderId: order._id,
        url: `/orders/${order._id}`
      },
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get order analytics
// @route   GET /api/orders/analytics
// @access  Private
router.get('/analytics/summary', protect, async (req, res, next) => {
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

    const analytics = await Order.getSalesAnalytics(req.user.id, startDate, new Date());

    const summary = await Order.aggregate([
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
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          pendingOrders: 0
        },
        analytics
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;