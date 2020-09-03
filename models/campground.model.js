const mongoose = require('mongoose');

// MATCH WITH EXISTING SCHEMA ON YELPCAMP
let campgroundSchema = new mongoose.Schema(
  {
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
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenities',
      },
    ],
    country: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Countries',
      },
      Continent_Name: String,
      Country_Name: String,
      Two_Letter_Country_Code: String,
    },
    bestSeasons: {
      vasanta: { type: Boolean },
      grishma: { type: Boolean },
      varsha: { type: Boolean },
      sharat: { type: Boolean },
      hemant: { type: Boolean },
      shishira: { type: Boolean },
    },
    hikingLevel: {
      level: Number,
      levelName: String,
      levelDesc: String,
    },
    trekTechnicalGrade: {
      level: Number,
      levelName: String,
      levelDesc: String,
    },
    fitnessLevel: {
      level: Number,
      levelName: String,
      levelDesc: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campground', campgroundSchema);
