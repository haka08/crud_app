// Importing the express framework and creating a router
const express = require('express');
const router = express.Router();

// Importing the 'Post' model for database interaction
const Post = require('../models/post');

// Home route
router.get('/', (req, res) => {
  // Retrieve all posts from the database
  Post.find({}, (err, posts) => {
    if (err) {
      console.error(err);
      res.render('error'); // Render an error page if there's an issue
    } else {
      res.render('home', { posts }); // Render the 'home' page with retrieved posts
    }
  });
});

// Post route
router.get('/post/:id', (req, res) => {
  // Retrieve a specific post from the database by its ID
  Post.findById(req.params.id, (err, post) => {
    if (err) {
      console.error(err);
      res.render('error'); // Render an error page if there's an issue
    } else {
      res.render('post', { post }); // Render the 'post' page with the retrieved post
    }
  });
});


// Exporting the router for use in other parts of the application
module.exports = router;
