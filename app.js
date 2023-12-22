// Express server setup with MongoDB, EJS, Passport, and more

// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('./models/user');
const PostModel = require('./models/post');
const flash = require('connect-flash');


// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the view engine and configure middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://hafsakabeer:VnSdTmwdCRsoApA4@cluster0.av1vb9j.mongodb.net/?retryWrites=true&w=majority';

// MongoDB connection events
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Connection Error:', err);
});

// Express session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Passport setup

app.use(flash());

// Use the local strategy for authentication
passport.use(new LocalStrategy(UserModel.authenticate()));
app.use(passport.initialize());
app.use(passport.session());

// Use the flash middleware with Passport
app.use((req, res, next) => {
  res.locals.errorMessage = req.flash('error');
  next();
});

// Set up Passport with local strategy
passport.use(new LocalStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());



// Middleware to pass user data to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});


// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.send('Error during logout');
    }
    res.redirect('/');
  });
});


// Define the Post schema
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName: String, 
  lastName: String,
  image: String, 
  createdAt: { type: Date, default: Date.now },
});


// Check if the Post model already exists
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Home route to retrieve posts from the database and render the home page
app.get('/', (req, res) => {
  // Retrieve posts from the database and render the home page
  Post.find({})
    .then((posts) => {
      res.render('home', { posts });
    })
    .catch((err) => {
      console.error(err);
      res.redirect('/');
    });
});

// Post route to retrieve a specific post from the database
app.get('/posts/:id', (req, res) => {
  Post.findById(req.params.id)
    .populate('author') // Populate the author field with user data
    .then((post) => {
      if (!post) {
        console.error('Post not found');
        return res.redirect('/');
      }

      res.render('singlepost', { post, currentUser: res.locals.currentUser });
    })
    .catch((err) => {
      console.error(err);
      res.redirect('/');
    });
});



// Set up multer for handling file uploads
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Set a unique filename
  },
});

const upload = multer({ storage: storage });


// Create route to render the create form
app.get('/create', isLoggedIn, (req, res) => {
  res.render('create');
});

// Create route to handle form submission for creating a new post
app.post('/create', isLoggedIn, upload.single('image'), async (req, res) => {
  console.log('Received form data:', req.body);

  const { title, content } = req.body;
  const { firstName, lastName } = req.user;

  // Check if an image was uploaded
  console.log('Uploaded file information:', req.file);
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const newPost = new Post({
    title,
    content,
    author: req.user._id,
    firstName: req.user.firstName, 
    lastName: req.user.lastName,   
    image,
  });

  console.log('New post object:', newPost);

  newPost.save()
  .then((savedPost) => {
    console.log('Post saved successfully:', savedPost);

    // Redirect to the newly created post page
    res.redirect(`/posts/${savedPost._id}`);
  })
  .catch((err) => {
    console.error('Error saving post:', err);
    res.redirect('/create'); // Handle error
  });

});



// Register route to render the registration form
app.get('/register', (req, res) => {
  res.render('register', { message: null });
});

// Register route to handle form submission for user registration
app.post('/register', async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;

  // Check if the username already exists or if any required field is missing
  const usernameExists = await UserModel.exists({ username });
  const requiredFieldsMissing = !username || !password || !email;

  if (usernameExists || requiredFieldsMissing) {
    let errorMessage = '';
    if (usernameExists) {
      errorMessage = 'Username already exists. Please choose a different username.';
    } else {
      errorMessage = 'Please fill in all required fields.';
    }
    return res.render('register', { message: errorMessage });
  }

  // If there's no error, proceed with user registration
  const newUser = new UserModel({ username, firstName, lastName, email });

  UserModel.register(newUser, password, (err, user) => {
    if (err) {
      console.error(err);
      return res.render('register', { message: 'Error during registration' });
    }

    passport.authenticate('local')(req, res, () => {
      res.redirect('/login');
    });
  });
});



// Login route to render the login form
app.get('/login', (req, res) => {
  res.render('login', { message: null }); 
});

// Login route to handle form submission for user login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true, 
}));

// Logout route
app.get('/logout', (req, res) => {
  req.logout(); // Remove the callback function

  // Redirect after logout
  res.redirect('/');
});



// Middleware to check if a user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


// Add routes for user account management (edit, update, delete)
app.get('/account', isLoggedIn, async (req, res) => {
  try {
    const userPosts = await Post.find({ author: req.user._id });

    res.render('account', { userPosts });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});


// Edit post route
app.get('/posts/edit/:id', isLoggedIn, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    res.render('editpost', { post });
  } catch (err) {
    console.error(err);
    res.redirect('/account');
  }
});

// Update post route
app.post('/posts/edit/:id', isLoggedIn, upload.single('image'), async (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  // Check if a new image was uploaded
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      { title, content, image },
      { new: true }
    );
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    res.redirect('/account');
  }
});


// Delete post route
app.get('/posts/delete/:id', isLoggedIn, async (req, res) => {
  const postId = req.params.id;
  try {
    await Post.findByIdAndDelete(postId);
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    res.redirect('/account');
  }
});


// Delete account route
app.get('/delete-account', isLoggedIn, async (req, res) => {
  try {
    // Perform actions to delete the user account and associated posts

    // Delete the user account
    await UserModel.findOneAndDelete({ _id: req.user._id });

    // Delete all posts created by the user
    await Post.deleteMany({ author: req.user._id });

    req.logout(); // Log the user out
    res.redirect('/'); // Redirect to the home page
  } catch (error) {
    console.error('Error deleting account:', error);
    res.redirect('/'); // Redirect to the account page if an error occurs
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


