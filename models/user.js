// Importing mongoose for MongoDB interactions
const mongoose = require('mongoose');
// Importing passport-local-mongoose for simplified user authentication
const passportLocalMongoose = require('passport-local-mongoose');

// Defining a Mongoose schema for the 'User' model
const userSchema = new mongoose.Schema({
  username: String,       // User's username
  password: String,       // User's password
  firstName: String,      // User's first name
  lastName: String,       // User's last name
  email: String,          // User's email address
});

// Adding Passport-Local Mongoose plugin to simplify user authentication
userSchema.plugin(passportLocalMongoose);

// Middleware to remove posts when a user is removed
userSchema.pre('remove', function (next) {
  // Remove all posts associated with this user
  Post.deleteMany({ author: this._id }, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
});

// Creating the User model named 'UserModel'
const UserModel = mongoose.model('User', userSchema);

// Exporting the 'UserModel' for use in other parts of the application
module.exports = UserModel;
