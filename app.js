// initializing dotenv file
require('dotenv').config();

// initializing frameworks
var express             = require("express"),
    app                 = express(),
    bodyParser          = require("body-parser"),
    mongoose            = require("mongoose"),
    flash               = require("connect-flash"),
    passport            = require("passport"),
    LocalStrategy       = require("passport-local"),
    methodOverride      = require("method-override"),
    Campground          = require("./models/campground"),
    Comment             = require("./models/comment"),
    User                = require("./models/user"),
    seedDB              = require("./seeds");

// requiring routes
var commentRoutes       = require("./routes/comments"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index");

// connecting to MongoDB
mongoose.connect("mongodb://localhost/yelp_camp");

// executing bodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));

// setting default view engine to .ejs
app.set("view engine","ejs");

// use public directory
app.use(express.static(__dirname + "/public"));

// use method override
app.use(methodOverride("_method"));

// use connect-flash
app.use(flash());

// seeding database
// seedDB();

// configuring Moment
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware for currentUser: req.user
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// use route files we required
// adding shortere route declarations
app.use("/",indexRoutes);
app.use("/campgrounds", campgroundRoutes);      // takes campground routes and appends "/campgrounds"
app.use("/campgrounds/:id/comments",commentRoutes);

// =============== LISTENER INITIALIZATION =============== \\

// adding listener
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server Has Started!");
});
