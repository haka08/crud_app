// Importing mongoose for MongoDB interactions
const mongoose = require('mongoose');

// Defining a Mongoose schema for the 'Post' model
const postSchema = new mongoose.Schema({
  title: String,          // Title of the post
  content: String,        // Content of the post
  author: {               // Author of the post, referencing 'User' model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstName: String,      // Author's first name
  lastName: String,       // Author's last name
  image: String,          // URL of the post's image
  createdAt: {            // Creation timestamp with default value
    type: Date,
    default: Date.now
  },
});

// Creating a Mongoose model named 'PostModel'
const PostModel = mongoose.model('Post', postSchema);

// Exporting the 'PostModel'
module.exports = PostModel;

