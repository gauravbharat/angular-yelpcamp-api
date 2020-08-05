const mongoose = require('mongoose');
const Campground = require('../models/campground.model');
const chalk = require('../utils/chalk.util');

let cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

exports.getAllCampgrounds = async (req, res) => {
  // Get the pagination query parameters
  // Prefixing + operator to a string converts its type to Number
  const pageSize = +req.query.pagesize;
  let currentPage = +req.query.page;
  let campgroundQuery = Campground.find();
  let campgroundsCount = Campground.countDocuments();

  /** Prepare find() for the search string passed */
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    campgroundQuery = Campground.find({ name: regex });
    campgroundsCount = Campground.countDocuments({ name: regex });
  }

  if (pageSize && currentPage) {
    campgroundQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }

  try {
    const campgrounds = await campgroundQuery;
    const totalCampgroundsCount = await campgroundsCount;

    if (campgrounds && totalCampgroundsCount > 0) {
      res.status(200).json({
        message: 'Campgrounds fetched successfully!',
        campgrounds,
        maxCampgrounds: totalCampgroundsCount,
      });
    } else {
      res.status(204).json({
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

exports.getCampground = async (req, res) => {
  let campgroundId;

  /** Return if user passes an invalid campgroundId */
  if (mongoose.Types.ObjectId.isValid(req.params.campgroundId)) {
    campgroundId = await mongoose.Types.ObjectId(req.params.campgroundId);
  } else {
    chalk.logError(
      'get-campground: Invalid campgroundId passed',
      req.params.campgroundId
    );
    return res.status(400).json({ message: 'Invalid Campground requested!' });
  }

  try {
    const campground = await Campground.findById(campgroundId);

    // console.log(campground);

    if (campground) {
      res.status(200).json(campground);
    } else {
      res.status(404).json({ message: 'Campground not found!' });
    }
  } catch (error) {
    chalk.logError('get-campground', error);
    console.log('get-campground', error);
    res.status(500).json({
      message: 'Fetching post failed!',
    });
  }
};

exports.createCampground = async (req, res) => {
  // console.log(req.body);
  // console.log(req.file.path);

  try {
    // upload image file on cloud and save return path on db
    let result = await cloudinary.uploader.upload(req.file.path);
    req.body.image = result.secure_url;

    // return res.status(200).json({ message: 'trial run' });

    let addedCampground = await Campground.create(req.body);

    res.status(201).json({
      message: 'Campground created successfully!',
      ...addedCampground,
      campgroundId: addedCampground._id,
    });
  } catch (error) {
    chalk.logError('create-campground', error);
    console.log('create-campground', error);
    res.status(500).json({ message: 'Error creating campground!' });
  }
};

exports.editCampground = async (req, res) => {
  let campgroundId;

  /** Return if user passes an invalid campgroundId */
  if (mongoose.Types.ObjectId.isValid(req.params.campgroundId)) {
    campgroundId = await mongoose.Types.ObjectId(req.params.campgroundId);
  } else {
    chalk.logError(
      'get-campground: Invalid campgroundId passed',
      req.params.campgroundId
    );
    return res.status(400).json({ message: 'Invalid Campground requested!' });
  }

  // Update the old image file name when NOT updating post with a new image
  let image = req.body.image;

  if (req.file && req.file.path) {
    try {
      let result = await cloudinary.uploader.upload(req.file.path);
      image = result.secure_url;
    } catch (error) {
      console.log('cloudinary_edit_campground', error);
      return res
        .status(500)
        .json({ message: 'Error uploading image on cloud storage!' });
    }
  }

  try {
    const campround = await new Campground({
      _id: req.body._id,
      name: req.body.name,
      price: req.body.price,
      image,
      location: req.body.location,
      description: req.body.description,
    });

    //using updateOne() method instead of findOneAndUpdate() because we don't need back the new document
    const result = await Campground.updateOne({ _id: campgroundId }, campround);

    // console.log('edit campground result', result);

    if (result.n > 0) {
      res.status(200).json({ message: 'Update successful!' });
    } else {
      res.status(401).json({ message: 'Not authorized!' });
    }
  } catch (error) {
    chalk.logError('edit-campground', error);
    console.log('edit-campground', error);
    res.status(500).json({ message: 'Error editing campground!' });
  }
};
