const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a restaurant name'],
      trim: true,
      maxlength: [100, 'Restaurant name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    cuisine: {
      type: [String],
      required: [true, 'Please add at least one cuisine type'],
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        default: 'United States'
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    contact: {
      phone: {
        type: String,
        required: true
      },
      email: {
        type: String,
        lowercase: true
      },
      website: String
    },
    hours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    deliveryInfo: {
      deliveryFee: {
        type: Number,
        default: 2.99,
        min: 0
      },
      minOrder: {
        type: Number,
        default: 10,
        min: 0
      },
      deliveryTime: {
        type: Number, // in minutes
        default: 30,
        min: 0
      },
      deliveryRadius: {
        type: Number, // in miles
        default: 5,
        min: 0
      }
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
    images: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Create index for better search performance
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });
restaurantSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);