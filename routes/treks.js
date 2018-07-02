// Initializing frameworks
var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'tharmaman', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// initializing Google Geocoder
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// ================= CAMPGROUNDS ROUTES  ================= \\

// REST INDEX - show all campgrounds from database 
router.get("/", function(req, res){
    // req.user        // contain username and id of user, undefined if no one signed in
    // get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log("Damn shawty we hit an error");
            console.log(err);
        } else {
            // console.log("HERE ARE ALL THE CAMPGROUNDS!!");
            // console.log(allCampgrounds);
            // render campgrounds
            res.render("treks/index", {campgrounds:allCampgrounds, page: 'treks'});
        }
    });
});

// REST CREATE - add new campgrounds to database 
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

    console.log(req.body.campground);
    var default_image = "http://res.cloudinary.com/tharmaman/image/upload/v1530419064/samples/landscapes/nature-mountains.jpg"
    var image = req.body.image ? req.body.image : default_image;
    var name = req.body.name;
    var price = req.body.price;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    
    // passing through geocoder
    geocoder.geocode(req.body.location, function(err, data){
        if (err || !data.length){
            console.log(err);
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        // data returns an array with these attributes
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        // creates a better version of the address entered
        var location = data[0].formattedAddress;
        
        // uploading image to cloudinary
        cloudinary.uploader.upload(req.file.path, function(result){
            if (err){
                console.log(err);
                req.flash("error", "Could not upload image")
            }
            // adding a secure cloudinary url for the image
            image = result.secure_url;
            
             // create a object to add to the db
            var newCampground = {
                name: name, 
                image: image, 
                description: desc, 
                author: author,
                price: price,
                location: location,
                lat: lat,
                lng: lng
            };
            
            // creating new campground document to store in DB
            Campground.create(newCampground, function(err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            } else {
                console.log(campground);
                req.flash("success", "Successfully Added Trek!");
                res.redirect('/treks/');
            }
          });
        });
        
    });
});

// REST NEW - show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("treks/new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single campground
router.get("/:id", function(req, res){
    // find campground with provided ID
    // passing actual comments need to use .populate then .exec
    // finding campground by ID, then populate comments and then execute query
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Trek not found");
            res.redirect("back");
            console.log(err);
        } else {
            console.log(foundCampground);
            // render show template with said campground
            res.render("treks/show", {campground: foundCampground});
        }
    });
});

// REST EDIT - GET
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        // error checking is redundant because otherwise middleware would return error
        Campground.findById(req.params.id, function(err, foundCampground){
            res.render("treks/edit", {campground: foundCampground});
    });
});


// REST UPDATE- PUT
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    // adding to campground object these below properties
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated Trek!");
            res.redirect("/treks/" + campground._id);
        }
    });
  });
});

// REST DESTROY - DELETE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/treks");
        } else {
            req.flash("success", "Successfully Deleted Trek!");
            res.redirect("/treks");
        }
    });
});

module.exports = router;