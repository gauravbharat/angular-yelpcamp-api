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
        ref: 'User',
      },
      Continent_Code: String,
      Continent_Name: String,
      Country_Name: String,
      Two_Letter_Country_Code: String,
    },
    bestSeason: [Number],
    hikingLevels: [Number],
    trekTechnicalGrades: [Number],
    fitnessLevels: [Number],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campground', campgroundSchema);

/** 
 * Grouped under location:
 * bestSeason expected data: 
 * [1,2,3,4,5,6]
 * There are six ritu: vasanta (spring); grishma (summer); varsha (rainy or monsoon); sharat (autumn); hemant (pre-winter); and shishira (winter).
 * 
 * Grouped under Amenities:
 * Refer table Hike
 * hikingLevel expected data: 
 * [0,1,2,3, 4]
 * NA, Moderate Walking, Walking, Mountain Hiking, Trekking
 * 
 * Trek Technical Grades expected data:
 * [0,1,2,3]
 * NA, Level 1, Level 2, Level 3
 * 
 * Level 1: Walking with a low chance of injury, light trekking shoes or approach shoes are okay for this level.
   Level 2: Mountain climbing, with the possibility of occasional use of the hands or chains or ropes to move up the route. Little potential danger is encountered. Ankle high hiking boots strongly recommended.
   Level 3: Scrambling with increased exposure. Handholds are necessary. Chains, ladders, and other aids may be in place on the route to navigate safely. Exposure is present, and falls could result in serious injury or death.
 * 
 * Fitness Levels expected data:
 * [0,1,2,3,4,5]
 * NA, Easiest, Easy, Moderate, Challenging, Very Difficult
 * 
 */
