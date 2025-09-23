const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a product description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a product price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Please add a product image'],
    },
    category: {
      type: String,
      required: [true, 'Please add a product category'],
      enum: [
        'pizza',
        'burgers',
        'salads',
        'desserts',
        'drinks',
        'sides',
        'asian',
        'mexican',
        'italian',
        'seafood'
      ],
    },
    ingredients: [{
      type: String,
      trim: true
    }],
    nutritionalInfo: {
      calories: Number,
      protein: String,
      carbs: String,
      fat: String,
      allergens: [String]
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isVegetarian: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isGlutenFree: {
      type: Boolean,
      default: false
    },
    spiceLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15
    }
  },
  {
    timestamps: true,
  }
);

// Create index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, restaurant: 1 });

module.exports = mongoose.model('Product', productSchema);