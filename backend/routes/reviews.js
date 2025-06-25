import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validateReview } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get all reviews for seller
// @route   GET /api/reviews
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      rating,
      status = 'approved',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { seller: req.user.id };

    // Add filters
    if (rating) query.rating = parseInt(rating);
    if (status) query.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('product', 'name images');

    const total = await Review.countDocuments(query);

    // Get review statistics
    const stats = await Review.aggregate([
      { $match: { seller: req.user._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: stats[0]?.ratingDistribution.filter(r => r === rating).length || 0
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: stats[0]?.totalReviews || 0,
        ratingDistribution
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get reviews for a specific product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      product: req.params.productId,
      status: 'approved'
    };

    if (rating) query.rating = parseInt(rating);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Get review statistics for this product
    const stats = await Review.getReviewStats(req.params.productId);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Public
router.post('/', validateReview, async (req, res, next) => {
  try {
    const { productId, customer, rating, title, comment, orderId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      'customer.email': customer.email
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = await Review.create({
      product: productId,
      seller: product.seller,
      customer,
      order: orderId,
      rating,
      title,
      comment,
      verified: !!orderId, // Mark as verified if order ID is provided
      status: 'approved', // Auto-approve for now
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'website'
      }
    });

    // Create notification for seller
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.createNotification({
      recipient: product.seller,
      type: 'new_review',
      title: 'New Review Received',
      message: `${customer.name} left a ${rating}-star review for ${product.name}`,
      data: {
        reviewId: review._id,
        productId: product._id,
        url: `/reviews/${review._id}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Respond to review
// @route   PUT /api/reviews/:id/respond
// @access  Private
router.put('/:id/respond', protect, async (req, res, next) => {
  try {
    const { comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.addResponse(comment, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Public
router.put('/:id/helpful', optionalAuth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const userId = req.user?.id || req.ip; // Use IP if user not authenticated
    await review.markHelpful(userId);

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: review
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Flag review
// @route   PUT /api/reviews/:id/flag
// @access  Public
router.put('/:id/flag', optionalAuth, async (req, res, next) => {
  try {
    const { reason, note } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.flags.push({
      reason,
      note,
      reportedBy: req.user?.id,
      reportedAt: new Date()
    });

    // Auto-flag if multiple reports
    if (review.flags.length >= 3) {
      review.status = 'flagged';
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review flagged successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update review status
// @route   PUT /api/reviews/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review status updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
});

export default router;