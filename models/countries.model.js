const mongoose = require('mongoose');
const countriesModel = {};
const { countriesList } = require('./data/countries.data');
const chalk = require('../utils/chalk.util');
const majorVersion = 1;

let countriesSchema = new mongoose.Schema(
  {
    Continent_Code: { type: String, trim: true },
    Continent_Name: { type: String, trim: true },
    Country_Name: { type: String, required: true, trim: true },
    Country_Number: { type: Number },
    Three_Letter_Country_Code: { type: String, trim: true },
    Two_Letter_Country_Code: { type: String, trim: true },
    majorVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

countriesModel.Countries = mongoose.model('Countries', countriesSchema);

countriesModel.populateCountries = async () => {
  const countries = await countriesModel.Countries.countDocuments();

  if (countries === 0) {
    try {
      for (let obj of countriesList) {
        await countriesModel.Countries.collection.insertOne({
          Continent_Code: obj.Continent_Code,
          Continent_Name: obj.Continent_Name,
          Country_Name: obj.Country_Name,
          Country_Number: obj.Country_Number,
          Three_Letter_Country_Code: obj.Three_Letter_Country_Code,
          Two_Letter_Country_Code: obj.Two_Letter_Country_Code,
          majorVersion,
        });
      }
    } catch (error) {
      chalk.logError('Error uploading Countries', error);
      // Let admin fix this error before starting the server
      throw new Error(
        'Error uploading required Countries collections data into database! Contact Nodejs Admin!!'
      );
    }
  }
};

module.exports = countriesModel;
