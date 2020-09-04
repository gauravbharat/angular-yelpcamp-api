/** 04092020 - Gaurav - New model to record user ratings to Campgrounds */
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: 'Please provide a rating (1-5 stars).',
      min: 1,
      max: 5,
    },
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
    },
    campgroundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campground',
    },
  },
  {
    // createdAt and updatedAt, Date type fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Rating', ratingSchema);
