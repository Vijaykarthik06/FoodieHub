const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getRestaurantOrders
} = require('../controllers/orderController');
const { protect, restaurantOwner, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getUserOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, restaurantOwner, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/rate', protect, rateOrder);
router.get('/restaurant/:restaurantId', protect, restaurantOwner, getRestaurantOrders);

module.exports = router;