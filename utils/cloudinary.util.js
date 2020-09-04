let cloudinaryAPI = {};

cloudinaryAPI.cloudinary = require('cloudinary');
cloudinaryAPI.cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinaryAPI.getCloudinaryImagePublicId = (strPath) => {
  // Extract Cloudinary image public Id from the path
  if (strPath) {
    let slice1 = strPath.slice(strPath.lastIndexOf('/') + 1);
    let publicId = slice1.slice(0, slice1.lastIndexOf('.'));
    return publicId;
  }
  return null;
};

module.exports = cloudinaryAPI;
