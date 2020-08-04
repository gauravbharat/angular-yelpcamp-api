const mongoose = require('mongoose');

// let campgroundSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     price: {
//       type: Number,
//       default: 0,
//       validate(value) {
//         if (value < 0) throw new Error('Price must be a positive number!');
//       },
//     },
//     image: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     location: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// MATCH WITH EXISTING SCHEMA ON YELPCAMP
let campgroundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: {
    type: String,
    default: '0.00',
    validate(value) {
      if (value === NaN || Number(value) < 0)
        throw new Error('Price must be a positive number!');
    },
  },
  image: { type: String, required: true },
  location: String,
  latitude: Number,
  longitude: Number,
  description: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: String,
  },
  created: { type: Date, default: Date.now },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
});

module.exports = mongoose.model('Campground', campgroundSchema);
