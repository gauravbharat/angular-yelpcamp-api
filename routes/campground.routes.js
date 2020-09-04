const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/check-auth.middleware');
const extractFile = require('../middleware/multer.middleware');
const CampgroundController = require('../controllers/campground.controller');

// Get all campgrounds
router.get('', CampgroundController.getAllCampgrounds);

// Get stats for UI Homepage
router.get('/stats', CampgroundController.getCampgroundsStats);

// Get all static data
router.get('/static', CampgroundController.getMiscStaticData);

// Get Camp Levels static data
router.get('/camp-levels', CampgroundController.getCampLevelsData);

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

// get current user's camp rating
router.get(
  '/rating/:campgroundId',
  checkAuth,
  CampgroundController.getUserCampRating
);

// update campground rating
router.post('/rating', checkAuth, CampgroundController.rateCampround);

module.exports = router;
