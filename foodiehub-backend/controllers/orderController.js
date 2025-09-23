const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    restaurant,
    items,
    deliveryAddress,
    contactInfo,
    paymentMethod,
    couponCode,
    specialInstructions
  } = req.body;

  // Validate restaurant
  const restaurantData = await Restaurant.findById(restaurant);
  if (!restaurantData || !restaurantData.isActive) {
    res.status(400);
    throw new Error('Restaurant not available');
  }

  // Validate items and calculate subtotal
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isAvailable) {
      res.status(400);
      throw new Error(`Product ${item.product} not available`);
    }

    if (product.restaurant.toString() !== restaurant) {
      res.status(400);
      throw new Error('All items must be from the same restaurant');
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions
    });
  }

  // Check minimum order amount
  if (subtotal < restaurantData.deliveryInfo.minOrder) {
    res.status(400);
    throw new Error(`Minimum order amount is $${restaurantData.deliveryInfo.minOrder}`);
  }

  // Apply coupon if provided
  let discount = 0;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    
    if (coupon && coupon.isValid()) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }

      // Check if coupon applies to this restaurant
      if (coupon.applicableRestaurants.length > 0 && 
          !coupon.applicableRestaurants.includes(restaurant)) {
        discount = 0;
        coupon = null;
      }

      // Check if coupon applies to any product category
      if (coupon.applicableCategories.length > 0) {
        const hasApplicableCategory = orderItems.some(item => {
          const productCategory = items.find(i => i.product.toString() === item.product.toString())?.category;
          return productCategory && coupon.applicableCategories.includes(productCategory);
        });

        if (!hasApplicableCategory) {
          discount = 0;
          coupon = null;
        }
      }
    }
  }

  // Calculate totals
  const deliveryFee = restaurantData.deliveryInfo.deliveryFee;
  const tax = (subtotal - discount) * 0.08; // 8% tax
  const total = subtotal - discount + deliveryFee + tax;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    restaurant,
    items: orderItems,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    deliveryAddress,
    contactInfo,
    paymentMethod,
    coupon: coupon?._id,
    specialInstructions,
    estimatedDelivery: new Date(Date.now() + restaurantData.deliveryInfo.deliveryTime * 60000)
  });

  // Update coupon usage if applied
  if (coupon) {
    coupon.usedCount += 1;
    await coupon.save();
  }

  // Populate restaurant details in response
  const populatedOrder = await Order.findById(order._id)
    .populate('restaurant', 'name cuisine deliveryInfo')
    .populate('user', 'name email');

  res.status(201).json(populatedOrder);
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('restaurant', 'name cuisine')
    .sort({ createdAt: -1 });

  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name cuisine contact address deliveryInfo')
    .populate('user', 'name email phone')
    .populate('items.product', 'name image category');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is admin/restaurant owner
  if (order.user._id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && 
      order.restaurant.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Restaurant Owner or Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the restaurant or is admin
  const restaurant = await Restaurant.findById(order.restaurant);
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  order.orderStatus = status;

  if (status === 'delivered') {
    order.deliveredAt = new Date();
  } else if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.cancellationReason;
  }

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Only allow cancellation if order is still pending or confirmed
  if (!['pending', 'confirmed'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason;

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private
const rateOrder = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to rate this order');
  }

  // Only allow rating delivered orders
  if (order.orderStatus !== 'delivered') {
    res.status(400);
    throw new Error('Only delivered orders can be rated');
  }

  order.rating = rating;
  order.review = review;

  const updatedOrder = await order.save();

  // Update restaurant rating
  await updateRestaurantRating(order.restaurant);

  res.json(updatedOrder);
});

// Helper function to update restaurant rating
const updateRestaurantRating = async (restaurantId) => {
  const orders = await Order.find({
    restaurant: restaurantId,
    rating: { $exists: true, $gt: 0 }
  });

  if (orders.length > 0) {
    const totalRating = orders.reduce((sum, order) => sum + order.rating, 0);
    const averageRating = totalRating / orders.length;

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: averageRating,
      numReviews: orders.length
    });
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private/Restaurant Owner or Admin
const getRestaurantOrders = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant not found');
  }

  // Check if user owns the restaurant or is admin
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view these orders');
  }

  const orders = await Order.find({ restaurant: req.params.restaurantId })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(orders);
});

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getRestaurantOrders,
};