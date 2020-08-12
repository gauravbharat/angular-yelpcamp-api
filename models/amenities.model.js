const mongoose = require('mongoose');
const amenityModel = {};
const chalk = require('../utils/chalk.util');

const amenitiesList = [
  { name: 'Tents' },
  { name: 'Yoga Classes' },
  { name: 'Upgraded Yurts' },
  { name: 'Communal Campground Kitchens' },
  { name: 'Coffee Cafes' },
  { name: 'Stargazing Tours' },
  { name: 'Live Music' },
  { name: 'Food Trucks' },
  { name: 'Swimming Pool' },
  { name: 'Breakfast' },
  { name: 'Lunch' },
  { name: 'Dinner' },
  { name: 'Games' },
  { name: 'Zip Lines' },
  { name: 'Hayrides' },
  { name: 'Game Rooms' },
  { name: 'Craft Brewing & Bars' },
  { name: 'Summer Movie Nights' },
  { name: 'Rental Cabins & RVs' },
  { name: 'Toilet Only' },
  { name: 'Toilet & Shower' },
  { name: 'Electrical Outlets' },
  { name: 'Internet & WiFi' },
  { name: 'Wildlife Safari' },
  { name: 'Campfire' },
  { name: 'Barbeque, Fire Rings, Grills' },
  { name: 'Drinking Water' },
  { name: 'Pets Allowed' },
  { name: 'Signage' },
];

let amenitiesSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

amenityModel.Amenities = mongoose.model('Amenities', amenitiesSchema);

amenityModel.populateAmenities = async () => {
  if ((await amenityModel.Amenities.countDocuments()) === 0) {
    try {
      const result = await amenityModel.Amenities.collection.insertMany(
        amenitiesList
      );
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
