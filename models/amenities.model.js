const mongoose = require('mongoose');
const amenityModel = {};
const chalk = require('../utils/chalk.util');
const { amenitiesList } = require('./data/amenities.data');

let amenitiesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    group: { type: String, required: true },
    majorVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

amenityModel.Amenities = mongoose.model('Amenities', amenitiesSchema);

amenityModel.populateAmenities = async () => {
  if ((await amenityModel.Amenities.countDocuments()) === 0) {
    try {
      for (let obj of amenitiesList) {
        await amenityModel.Amenities.collection.insertOne({
          name: obj.name,
          group: obj.group,
          majorVersion: 1,
        });
      }
    } catch (error) {
      chalk.logError('Error uploading amenities', error);
      // Let admin fix this error before starting the server
      throw new Error(
        'Error uploading required Amenities collections data into database! Contact Nodejs Admin!!'
      );
    }
  }
};

module.exports = amenityModel;
