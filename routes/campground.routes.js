const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/check-auth.middleware');
const extractFile = require('../middleware/multer.middleware');
const CampgroundController = require('../controllers/campground.controller');

// Get all campgrounds
router.get('', CampgroundController.getAllCampgrounds);

// Get all amenities
router.get('/amenities', CampgroundController.getAllAmenities);

// Get a single campground
router.get('/:campgroundId', CampgroundController.getCampground);

// Create new campground
router.post(
  '/create',
  checkAuth,
  extractFile,
  CampgroundController.createCampground
);

// Edit/Update campground
router.put(
  '/edit/:campgroundId',
  checkAuth,
  extractFile,
  CampgroundController.editCampground
);

// Delete campground
router.delete(
  '/:campgroundId',
  checkAuth,
  CampgroundController.deleteCampground
);

module.exports = router;
