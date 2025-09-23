const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByRestaurant,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');
const { protect, restaurantOwner, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/restaurant/:restaurantId', getProductsByRestaurant);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProduct);

// Protected routes
router.post('/', protect, restaurantOwner, createProduct);
router.put('/:id', protect, restaurantOwner, updateProduct);
router.delete('/:id', protect, restaurantOwner, deleteProduct);

module.exports = router;