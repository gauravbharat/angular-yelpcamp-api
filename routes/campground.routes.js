const express = require('express');
const router = express.Router();

const extractFile = require('../middleware/multer.middleware');
const CampgroundController = require('../controllers/campground.controller');

// Get all campgrounds
router.get('', CampgroundController.getAllCampgrounds);

// Create new campground
router.post('', extractFile, CampgroundController.createCampground);

module.exports = router;
