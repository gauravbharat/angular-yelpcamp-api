const Campground = require('../models/campground.model');
const chalk = require('../utils/chalk.util');

let cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllCampgrounds = async (req, res) => {
  try {
    const campgrounds = await Campground.find();
    const totalCampgroundsCount = await Campground.countDocuments();

    if (campgrounds && totalCampgroundsCount > 0) {
      res.status(200).json({
        message: 'Campgrounds fetched successfully!',
        campgrounds,
        maxCampgrounds: totalCampgroundsCount,
      });
    } else {
      res
        .status(204)
        .json({
          message: 'No campgrounds found!',
          campgrounds: null,
          maxCampgrounds: 0,
        });
    }
  } catch (error) {
    chalk.logError('get-all-campgrounds', error);
    console.log('get-all-campgrounds', error);
    res.status(500).json({ message: 'Error fetching campgrounds!' });
  }
};

exports.createCampground = async (req, res) => {
  console.log(req.body.campground);
  return res.status(200).json({ message: 'trial run' });

  try {
    // upload image file on cloud and save return path on db
    let result = await cloudinary.uploader.upload(req.file.path);
    req.body.campground.image = result.secure_url;

    let addedCampground = await Campground.create(req.body.campground);

    res.status(201).json({
      message: 'Campground created successfully!',
    });
  } catch (error) {
    chalk.logError('create-campgrounds', error);
    console.log('create-campgrounds', error);
    res.status(500).json({ message: 'Error creating campground!' });
  }
};
