const express = require('express');
const router = express.Router();

const extractFile = require('../middleware/multer.middleware');
const CampgroundController = require('../controllers/campground.controller');

// Get all campgrounds
router.get('', CampgroundController.getAllCampgrounds);

// Get a single campground
router.get('/:campgroundId', CampgroundController.getCampground);

// Create new campground
router.post('/create', extractFile, CampgroundController.createCampground);

// Edit/Update campground
router.put(
  '/edit/:campgroundId',
  extractFile,
  CampgroundController.editCampground
);

// Delete campground
router.delete('/:campgroundId', CampgroundController.deleteCampground);

module.exports = router;
