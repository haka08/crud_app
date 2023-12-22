// Importing the express framework, passport for authentication, and creating a router
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Importing the 'User' model for database interaction
const User = require('../models/user');

// Register route
router.get('/register', (req, res) => {
  res.render('register'); // Render the registration form
});

router.post('/register', (req, res) => {
  // Extracting user registration details from the request body
  const { username, password, firstName, lastName, email } = req.body;

  // Creating a new user instance with the provided details
  const newUser = new User({ username, firstName, lastName, email });

  // Registering the user using Passport-Local Mongoose
  User.register(newUser, password, (err, user) => {
    if (err) {
      console.error(err);
      return res.render('register'); // Render the registration form again on error
    }
    // Authenticating the user after successful registration and redirecting to home
    passport.authenticate('local')(req, res, () => {
      res.redirect('/');
    });
  });
});

// Login route
router.get('/login', (req, res) => {
  res.render('login'); // Render the login form
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}), (req, res) => {});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(); // Logging out the user
  res.redirect('/'); // Redirecting to the home page
});

// User profile route
router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { user: req.user }); // Render the user's profile page
});

// Middleware to check if a user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Continue if the user is authenticated
  }
  res.redirect('/login'); // Redirect to the login page if the user is not authenticated
}

// Exporting the router 
module.exports = router;
