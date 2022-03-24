const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const chalk = require('./utils/chalk.util');
const app = express();
const expressSanitizer = require('express-sanitizer');

const { populateAmenities } = require('./models/amenities.model');
const { populateCountries } = require('./models/countries.model');
const { populateHike } = require('./models/hike.model');

const campgroundRoutes = require('./routes/campground.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');

/** Connect to database */
mongoose
  .connect(process.env.DATABASEURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    chalk.logSuccess(`Connected to database ${process.env.DATABASEURL} !`);
    return;
  })
  .then(() => {
    // Populate campground amenities if the collection is empty
    populateAmenities();
    populateCountries();
    populateHike();
  })
  .catch((error) => {
    chalk.logError('database connection error', error);
    console.log('database connection error', error);
    chalk.logError('Error connecting to database!');
  });

/** Parse incoming req.body data to json() format */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/** Use Express Sanitizer for select incoming text */
app.use(expressSanitizer());

/** Intercept incoming requests and allow CORS by setting following headers to -
 * Allow ANY origin access,
 * Allow SPECIFIC header requests, and
 * Allow SPECIFIC REST access verbs
 * Tip: OPTIONS are passed along with the POST call
 */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://ng-yelpcamp.web.app/');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});

/** Set route prefixes */
app.use('/api/campgrounds', campgroundRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campgrounds/:campgroundId/comments', commentRoutes);

module.exports = app;
