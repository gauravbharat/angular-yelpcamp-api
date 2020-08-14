const mongoose = require('mongoose');
const Campground = require('../models/campground.model');
const { Amenities } = require('../models/amenities.model');
const chalk = require('../utils/chalk.util');

const {
  PROCESS_CAMPGROUND,
  validateIdentifier,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');

let cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const getCloudinaryImagePublicId = (strPath) => {
  // Extract Cloudinary image public Id from the path
  if (strPath) {
    let slice1 = strPath.slice(strPath.lastIndexOf('/') + 1);
    let publicId = slice1.slice(0, slice1.lastIndexOf('.'));
    return publicId;
  }
  return null;
};

exports.getAllAmenities = async (req, res) => {
  //No auth required to get this static data list
  try {
    const amenitiesList = await Amenities.find();

    if (amenitiesList) {
      res.status(200).json({
        message: 'Amenities fetched successfully!',
        amenitiesList,
      });
    } else {
      res.status(204).json({
        message: 'No amenities found, contact Angular-YelpCamp administrator!',
        amenitiesList,
      });
    }
  } catch (error) {
    chalk.logError('get-all-amenities', error);
    console.log('get-all-amenities', error);
    res.status(500).json({ message: 'Error fetching amenities!' });
  }
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

  // 06082020 - Added sort to send back records in descending order
  if (pageSize && currentPage) {
    campgroundQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize)
      .sort([['created', -1]]);
  }

  try {
    const campgrounds = await campgroundQuery
      .populate('amenities')
      .populate('comments')
      .exec();
    const totalCampgroundsCount = await campgroundsCount;

    // console.log(campgrounds);

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
    const campground = await Campground.findOne({ _id: campgroundId })
      .populate('amenities')
      .populate('comments')
      .exec();

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

  if (typeof req.body.amenities === 'string') {
    req.body.amenities = JSON.parse(req.body.amenities);
  }

  try {
    // upload image file on cloud and save return path on db
    let result = await cloudinary.uploader.upload(req.file.path);
    req.body.image = result.secure_url;

    // return res.status(200).json({ message: 'trial run' });

    /** Add author data available from the checkAuth middleware, after intercepting header,
     * verifying jwt token and extracting values from decoded jwt token */
    req.body = {
      ...req.body,
      author: {
        id: req.userData.userId,
        username: req.userData.username,
      },
    };

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
      'edit-campground: Invalid campgroundId passed',
      req.params.campgroundId
    );
    return res.status(400).json({ message: 'Invalid Campground requested!' });
  }

  // Update the old image file name when NOT updating post with a new image
  let image = req.body.image;

  if (req.file && req.file.path) {
    try {
      const campground = await Campground.findOne({
        _id: campgroundId,
        'author.id': req.userData.userId,
      });
      if (!campground) {
        return res.status(404).json({ message: 'Campground not found!' });
      }

      oldImagePath = campground.image;

      let result = await cloudinary.uploader.upload(req.file.path);
      image = result.secure_url;

      if (oldImagePath) {
        // Don't keep the user waiting for the old image to be deleted
        cloudinary.v2.uploader.destroy(
          getCloudinaryImagePublicId(oldImagePath)
        );
      }
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
      author: {
        id: req.userData.userId,
        username: req.userData.username,
      },
      amenities:
        typeof req.body.amenities === 'string'
          ? JSON.parse(req.body.amenities)
          : req.body.amenities,
    });

    //using updateOne() method instead of findOneAndUpdate() because we don't need back the new document
    const result = await Campground.updateOne(
      { _id: campgroundId, 'author.id': req.userData.userId },
      campround
    );
    // console.log(req.userData.userId);
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

exports.deleteCampground = async (req, res) => {
  let campgroundId;

  /** Return if user passes an invalid campgroundId */
  if (mongoose.Types.ObjectId.isValid(req.params.campgroundId)) {
    campgroundId = await mongoose.Types.ObjectId(req.params.campgroundId);
  } else {
    chalk.logError(
      'delete-campground: Invalid campgroundId passed',
      req.params.campgroundId
    );
    return res.status(400).json({ message: 'Invalid Campground requested!' });
  }

  let imagePath;

  const campground = await Campground.findById(campgroundId);
  if (campground) {
    imagePath = campground.image;
  }

  try {
    const result = await Campground.deleteOne({
      _id: campgroundId,
      'author.id': req.userData.userId,
    });

    if (result.n > 0) {
      res.status(200).json({ message: 'Post deleted!' });
    } else {
      // Would send this error even if campground does not exist
      res.status(401).json({ message: 'Not authorized!' });
    }
  } catch (error) {
    chalk.logError('delete-campground', error);
    console.log('delete-campground', error);
    res.status(500).json({
      message: 'Error deleting campground!',
    });
  }

  // destroy image uploaded on Cloudinary
  try {
    if (imagePath) {
      let result = await cloudinary.v2.uploader.destroy(
        getCloudinaryImagePublicId(imagePath)
      );
    }
  } catch (error) {
    chalk.logError('delete-campground: cloudinary_delete_post', error);
    console.log('cloudinary_delete_post', error);
  }
};
