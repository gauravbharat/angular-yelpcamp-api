const mongoose = require('mongoose');

let commentSchema = new mongoose.Schema(
  {
    text: String,
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
      avatar: String,
    },
    created: { type: Date, default: Date.now },
    edited: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false },
    likes: [
      new mongoose.Schema(
        {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          username: String,
          avatar: String,
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
