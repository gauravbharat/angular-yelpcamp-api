const multer = require('multer');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
};

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    // Replace empty spaces with a hyphen
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const extension = MIME_TYPE_MAP[file.mimetype];
    // return the filename, 1st argument is null for no error
    cb(null, `${name}-${Date.now()}.${extension}`);
  },
});

const imageFilter = function (req, file, callback) {
  //accept image file only
  const isValid = MIME_TYPE_MAP[file.mimetype];
  if (!isValid) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

module.exports = multer({ storage: storage, fileFilter: imageFilter }).single(
  'image'
);
