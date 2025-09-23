const express = require('express');
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantMenu,
  getRestaurantsByCuisine,
  getRestaurantsByCity,
  searchRestaurants
} = require('../controllers/restaurantController');
const { protect, restaurantOwner, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getRestaurants);
router.get('/search', searchRestaurants);
router.get('/cuisine/:cuisine', getRestaurantsByCuisine);
router.get('/city/:city', getRestaurantsByCity);
router.get('/:id', getRestaurant);
router.get('/:id/menu', getRestaurantMenu);

// Protected routes
router.post('/', protect, restaurantOwner, createRestaurant);
router.put('/:id', protect, restaurantOwner, updateRestaurant);
router.delete('/:id', protect, restaurantOwner, deleteRestaurant);

module.exports = router;