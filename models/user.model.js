const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: String,
  avatar: {
    type: String,
    default:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQJS3-GoTF9xqAIyRROWdTD8SUihnSdP5Ac2uPb6AzgGHHyeuuD',
  },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: { type: Boolean, default: false },
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  created: { type: Date, default: Date.now },
  isPublisher: { type: Boolean, default: false },
  isRequestedAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
});

/** Hash the plain text password before saving
 * pre and post, eg. before and after
 * Add document middleware to schema before the 'save' action
 * Use standard function not an arrow function because it did not bind
 * 'this' i.e. current document/record binding is required in this case */
userSchema.pre('save', async function (next) {
  // this === current user that is about to be saved
  const user = this;

  // hash only on signup process or if user modifies the password
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  // Proceed with execution of next line of code
  next();
});

/** Remove the password field before passing user object to client
 * This method is called whenever the conversion to json happen on this object
 * either implicitly or explicitly
 */
userSchema.methods.toJSON = function () {
  const user = this;

  // Make a copy
  const userObject = user.toObject();

  delete userObject.password;
  return userObject;
};

/** This method was created on purpose to save the tokens in the User object itself.
 * However, since this API is for refactoring of existing YelpCamp to Angular, USING the existing data
 * models on Mongo DB atlas server, just returned the token from this instance method. */
userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = await jwt.sign(
    { username: user.username, email: user.email, userId: user._id.toString() },
    process.env.JWT_SECTRE,
    { expiresIn: '1h' }
  );

  return token;
};

/** Find user using passed credentials and return */
userSchema.statics.findByCredentials = async (username, email, password) => {
  let user;

  if (username) {
    user = await User.findOne({ username });
  }

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    throw new Error('Login failed!');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Login failed!');
  }

  return user;
};

// userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;
