const mongoose = require('mongoose');
const Campground = require('../models/campground.model');
const User = require('../models/user.model');
const Rating = require('../models/rating.model');
const { Amenities } = require('../models/amenities.model');
const { Countries } = require('../models/countries.model');
const { Hike } = require('../models/hike.model');
const chalk = require('../utils/chalk.util');
const EmailHandler = require('../utils/email.util');
const CloudinaryAPI = require('../utils/cloudinary.util');

const NotificationController = require('./notification.controller');

const {
  PROCESS_CAMPGROUND,
  validateIdentifier,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');
const { RSA_NO_PADDING } = require('constants');

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const getHikeData = async () => {
  try {
    return await Hike.find();
  } catch (error) {
    throw new Error('Error getting Camp levels data!');
  }
};

exports.getMiscStaticData = async (req, res) => {
  //No auth required to get this static data list
  try {
    const countriesList = await Countries.find();
    const amenitiesList = await Amenities.find();
    const hikesData = await getHikeData();

    let data = '';
    let dataError = false;

    if (!countriesList) {
      data = 'countries ';
      dataError = true;
    }
    if (!amenitiesList) {
      data += 'amenities ';
      dataError = true;
    }
    if (!hikesData || hikesData.length <= 0) {
      data += 'hikes data ';
      dataError = true;
    }

    if (dataError)
      return res.status(204).json({
        message: `No ${data} found, contact Angular-YelpCamp administrator!`,
        countriesList,
      });

    res.status(200).json({
      message: 'Misc Data fetched successfully!',
      campStaticData: {
        countriesList,
        amenitiesList,
        seasons: hikesData[0].seasons,
        hikingLevels: hikesData[0].hikingLevels,
        trekTechnicalGrades: hikesData[0].trekTechnicalGrades,
        fitnessLevels: hikesData[0].fitnessLevels,
      },
    });
  } catch (error) {
    return returnError(
      'get-misc-camp-data',
      error,
      500,
      'Error fetching Camp Misc Data!',
      res
    );
  }
};

exports.getCampLevelsData = async (req, res) => {
  try {
    const hikesData = await getHikeData();

    if (!hikesData) {
      return res.status(204).json({
        message: `No Camp Levels data found, contact Angular-YelpCamp administrator!`,
        countriesList,
      });
    }

    res.status(200).json({
      message: 'Camp Levels Data fetched successfully!',
      campLevelsData: {
        seasons: hikesData[0].seasons,
        hikingLevels: hikesData[0].hikingLevels,
        trekTechnicalGrades: hikesData[0].trekTechnicalGrades,
        fitnessLevels: hikesData[0].fitnessLevels,
      },
    });
  } catch (error) {
    return returnError(
      'get-misc-camp-data',
      error,
      500,
      'Error fetching Camp Levels Data!',
      res
    );
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
      .sort([['updatedAt', -1]]);
  }

  try {
    /** 24082020 - Gaurav - Removed populating comments, retrospecitive to front-end change */
    const campgrounds = await campgroundQuery.populate('amenities').exec();
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
    return returnError(
      'get-all-campgrounds',
      error,
      500,
      'Error fetching campgrounds!',
      res
    );
  }
};

exports.getCampground = async (req, res) => {
  /** Return if user passes an invalid campgroundId */
  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'get-campground',
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

  try {
    const campground = await Campground.findOne({ _id: campgroundId })
      .populate('comments')
      .populate('amenities')
      .exec();

    if (campground) {
      let ratingData;

      if (campground.rating > 0) {
        const ratings = await Rating.find({
          campgroundId,
        });

        if (ratings.length > 0) {
          ratingData = await {
            ratingsCount: ratings.length,
            ratedBy: ratings.map((rating) => rating.author.username),
          };
        }
      }

      let campgroundData = { campground, ratingData };

      res.status(200).json(campgroundData);
    } else {
      res.status(404).json({ message: 'Campground not found!' });
    }
  } catch (error) {
    return returnError(
      'get-campground',
      error,
      500,
      'Fetching campground failed!',
      res
    );
  }
};

exports.getCampgroundsStats = async (req, res) => {
  try {
    const campgroundsCount = (await Campground.countDocuments()) | 0;
    const usersCount = (await User.countDocuments()) | 0;
    const contributorsCountArr = await Campground.distinct('author.id');

    const contributorsCount = contributorsCountArr
      ? contributorsCountArr.length
      : 0;

    res.status(200).json({
      campgroundsCount,
      usersCount,
      contributorsCount,
    });
  } catch (error) {
    return returnError(
      'get-campgrounds-stats',
      error,
      500,
      'Error getting campgrounds stats!',
      res
    );
  }
};

exports.createCampground = async (req, res) => {
  let addedCampground;

  if (typeof req.body.amenities === 'string') {
    req.body.amenities = JSON.parse(req.body.amenities);
  }

  if (typeof req.body.bestSeasons === 'string') {
    req.body.bestSeasons = JSON.parse(req.body.bestSeasons);
  }

  if (typeof req.body.hikingLevel === 'string') {
    req.body.hikingLevel = JSON.parse(req.body.hikingLevel);
  }

  if (typeof req.body.fitnessLevel === 'string') {
    req.body.fitnessLevel = JSON.parse(req.body.fitnessLevel);
  }

  if (typeof req.body.trekTechnicalGrade === 'string') {
    req.body.trekTechnicalGrade = JSON.parse(req.body.trekTechnicalGrade);
  }

  if (typeof req.body.country === 'string') {
    req.body.country = JSON.parse(req.body.country);
  }

  try {
    // upload image file on cloud and save return path on db
    let result = await CloudinaryAPI.cloudinary.v2.uploader.upload(
      req.file.path,
      { folder: 'ng-yelpcamp' }
    );
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

    addedCampground = await Campground.create(req.body);

    // console.log('addedCampground', addedCampground);

    res.status(201).json({
      message: 'Campground created successfully!',
      ...addedCampground,
      campgroundId: addedCampground._id,
    });
  } catch (error) {
    return returnError(
      'create-campground',
      error,
      500,
      'Error creating campground!',
      res
    );
  }

  /** 21082020 - Add new, non-blocking, campground notification to followers of the campground author */
  try {
    if (addedCampground) {
      const campgroundAuthor = await User.findById(req.userData.userId)
        .populate('followers')
        .exec();

      if (campgroundAuthor.followers && campgroundAuthor.followers.length > 0) {
        await campgroundAuthor.followers.forEach(async (follower) => {
          // check that follower opted to receive in-app camp notifications
          if (follower.enableNotifications.newCampground) {
            let notification = await NotificationController.createNotification({
              campgroundId: addedCampground._id,
              campgroundName: addedCampground.name,
              userId: req.userData.userId,
              username: req.userData.username,
              notificationType:
                NotificationController.notificationTypes.NEW_CAMPGROUND,
            });

            await follower.notifications.push(notification);
            await follower.save();
          }

          // check that follower opted to receive new camp emails
          if (follower.enableNotificationEmails.newCampground) {
            await EmailHandler.sendEmail({
              process: EmailHandler.PROCESS_NEW_CAMPGROUND,
              textOnly: false,
              emailTo: follower.email,
              emailSubject: `Angular-YelpCamp: A new campground "${addedCampground.name}" has a been posted!`,
              emailBody: `
              <div style="width: 60%; margin: 50px auto;">
              <h2>Hey, ${follower.firstName}!</h2>
              <br />
            
              <h2>
                A user you follow, ${campgroundAuthor.username}, just posted a new
                campground "${addedCampground.name}" -
              </h2>
              <br />
              <hr />
              <div
                  style="text-align: center;"
              >
                <img
                  style="
                    width: 700px;
                    height: auto;
                    object-fit: cover;
                    overflow: hidden;
                    border-radius: 5%;
                  "
                  src="${addedCampground.image}"
                  alt="${addedCampground.name}"
                />
                <h3>Location: ${addedCampground.location}</h3>
                <h3>Description: ${addedCampground.description}</h3>
              </div>
              <hr />
              <br />
            
              <h4>
                To visit campground,
                <a
                  href="${process.env.CLIENT_URL}/campgrounds/show/${addedCampground._id}"
                  target="_blank"
                  >click here</a
                >
              </h4>
              <h4>
                To see all notifications,
                <a href="${process.env.CLIENT_URL}/user/notifications" target="_blank"
                  >click here</a
                >
              </h4>
              <h4>
                To manage notifications,
                <a href="${process.env.CLIENT_URL}/user/current" target="_blank"
                  >click here</a
                >
              </h4>
              <br />
            
              <h4>Happy Camping!</h4>
            
              <h4>Best Regards,</h4>
              <h3>The Angular-YelpCamp Team ⛺️</h3>
            </div>`,
            });
          }
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

exports.editCampground = async (req, res) => {
  /** Return if user passes an invalid campgroundId */
  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'edit-campground',
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

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

      let result = await CloudinaryAPI.cloudinary.v2.uploader.upload(
        req.file.path,
        { folder: 'ng-yelpcamp' }
      );
      image = result.secure_url;

      if (oldImagePath) {
        // Don't keep the user waiting for the old image to be deleted
        CloudinaryAPI.cloudinary.v2.uploader.destroy(
          'ng-yelpcamp/' +
            CloudinaryAPI.getCloudinaryImagePublicId(oldImagePath)
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
    /** 31082020 - Gaurav - new campground object erased the old one, including comments.
     * Passed plain object instead */
    //using updateOne() method instead of findOneAndUpdate() because we don't need back the new document
    const result = await Campground.updateOne(
      { _id: campgroundId, 'author.id': req.userData.userId },
      {
        name: req.body.name,
        price: req.body.price,
        image,
        location: req.body.location,
        description: req.body.description,
        amenities:
          typeof req.body.amenities === 'string'
            ? JSON.parse(req.body.amenities)
            : req.body.amenities,
        bestSeasons:
          typeof req.body.bestSeasons === 'string'
            ? JSON.parse(req.body.bestSeasons)
            : req.body.bestSeasons,

        hikingLevel:
          typeof req.body.hikingLevel === 'string'
            ? JSON.parse(req.body.hikingLevel)
            : req.body.hikingLevel,

        fitnessLevel:
          typeof req.body.fitnessLevel === 'string'
            ? JSON.parse(req.body.fitnessLevel)
            : req.body.fitnessLevel,

        trekTechnicalGrade:
          typeof req.body.trekTechnicalGrade === 'string'
            ? JSON.parse(req.body.trekTechnicalGrade)
            : req.body.trekTechnicalGrade,

        country:
          typeof req.body.country === 'string'
            ? JSON.parse(req.body.country)
            : req.body.country,
      }
    );
    // console.log(req.body.country);
    // console.log('edit campground result', result);

    if (result.n > 0) {
      res.status(200).json({ message: 'Update successful!' });
    } else {
      res.status(401).json({ message: 'Not authorized!' });
    }
  } catch (error) {
    return returnError(
      'edit-campground',
      error,
      500,
      'Error editing campground!',
      res
    );
  }
};

exports.deleteCampground = async (req, res) => {
  /** Return if user passes an invalid campgroundId */
  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'edit-campground',
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;
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
    return returnError(
      'delete-campground',
      error,
      500,
      'Error deleting campground!',
      res
    );
  }

  // destroy image uploaded on Cloudinary
  try {
    if (imagePath) {
      let result = await CloudinaryAPI.cloudinary.v2.uploader.destroy(
        'ng-yelpcamp/' + CloudinaryAPI.getCloudinaryImagePublicId(imagePath)
      );
    }
  } catch (error) {
    chalk.logError('delete-campground: cloudinary_delete_post', error);
    console.log('cloudinary_delete_post', error);
  }
};

exports.getUserCampRating = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'get-user-campground-rating',
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

  try {
    const foundRating = await Rating.findOne({
      'author.id': req.userData.userId,
      campgroundId,
    });

    // console.log('foundRating', foundRating);

    if (!foundRating) {
      return res.status(204).json({
        message: 'No current user rating found for this campground!',
        rating: 0,
      });
    }

    return res.status(200).json({
      message: 'User rating found for current campground',
      rating: foundRating.rating,
    });
  } catch (error) {
    return returnError(
      'get-user-campground-rating',
      error,
      500,
      'Error rating campground!',
      res
    );
  }
};

exports.rateCampround = async (req, res) => {
  /** Return if user passes an invalid campgroundId */
  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'rate-campground',
    req.body.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;
  let rating = req.body.rating;

  if (isNaN(rating) || rating > 5) {
    return res
      .status(400)
      .json({ message: 'Rating should be a numeric value between 1 and 5!' });
  }

  try {
    const userRating = await Rating.findOne({
      'author.id': req.userData.userId,
      campgroundId,
    });

    if (userRating) {
      // update
      userRating.rating = rating;
      await userRating.save();
    } else {
      const result = await Rating.create({
        rating,
        'author.id': req.userData.userId,
        'author.username': req.userData.username,
        campgroundId,
      });
    }

    /** Get the ratings list from Rating for this campground, calculate average and store it in Campground */
    const ratings = await Rating.find({
      campgroundId,
    });

    let sum = 0;
    ratings.forEach((r) => {
      if (r.rating > 0) sum += r.rating;
    });
    // Calculate average and round it to nearest .5
    let average = sum / ratings.length;
    average = (Math.round(average * 2) / 2).toFixed(1);

    // console.log('Campground rating average', average);

    const result = await Campground.updateOne(
      { _id: campgroundId },
      { rating: average }
    );

    // console.log('Campground.updateOne result', result);

    if (result.n > 0) {
      res.status(200).json({
        message: 'Update successful!',
        // campgroundRating: average,
        // totalRatings: ratings.length,
        // currentUserRating: req.body.rating,
      });
    } else {
      res.status(401).json({ message: 'Not authorized!' });
    }
  } catch (error) {
    return returnError(
      'rate-campground',
      error,
      500,
      'Error rating campground!',
      res
    );
  }
};
