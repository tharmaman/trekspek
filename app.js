// initializing dotenv
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
    User                = require("./models/user");

// requiring routes
var commentRoutes       = require("./routes/comments"),
    trekRoutes          = require("./routes/treks"),
    indexRoutes         = require("./routes/index");

// check for environment variable
// console.log(process.env.DATABASEURL);

// adding backup to environment variable not loading up
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";

// connecting to MongoDB
mongoose.connect(url);

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
    secret: "Is the derivative share requirement indexed according to cost and percentage analysis?",
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
app.use("/treks", trekRoutes);      // takes trek routes and appends "/treks"
app.use("/treks/:id/comments",commentRoutes);

// =============== LISTENER INITIALIZATION ================= \\

// defaulting to local ports
var port = process.env.PORT || 3000,
    ip = process.env.IP || '0.0.0.0';

// adding listener
app.listen(port, ip, function(){
    console.log("TrekSpek Server Has Started!");
    console.log("Listening on: ");
    console.log(port);
    console.log(ip);
});