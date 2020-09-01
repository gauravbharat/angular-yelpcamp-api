const mongoose = require('mongoose');
const hikeModel = {};
const chalk = require('../utils/chalk.util');
const { hikeDataList } = require('./data/hikes.data');

let hikesSchema = new mongoose.Schema(
  {
    seasons: [
      {
        id: Number,
        indianName: String,
        englishName: String,
      },
    ],
    hikingLevels: [
      {
        level: Number,
        levelName: String,
        levelDesc: String,
      },
    ],
    trekTechnicalGrades: [
      {
        level: Number,
        levelName: String,
        levelDesc: String,
      },
    ],
    fitnessLevels: [
      {
        level: Number,
        levelName: String,
        levelDesc: String,
      },
    ],
    majorVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

hikeModel.Hike = mongoose.model('Hike', hikesSchema);

hikeModel.populateHike = async () => {
  if ((await hikeModel.Hike.countDocuments()) === 0) {
    try {
      const result = await hikeModel.Hike.collection.insertMany(hikeDataList);
    } catch (error) {
      chalk.logError('Error uploading hike scales', error);
      // Let admin fix this error before starting the server
      throw new Error(
        'Error uploading required Hike Scale data into database! Contact Nodejs Admin!!'
      );
    }
  }
};

module.exports = hikeModel;
