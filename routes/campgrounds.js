var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware")

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
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: 'campgrounds'});
        }
    });
});

// REST CREATE - add new campgrounds to database 
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    // passing through geocoder
    geocoder.geocode(req.body.location, function(err, data){
        if (err || !data.length){
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {
            name: name, 
            image: image, 
            description: desc, 
            author: author, 
            location: location,
            lat: lat,
            lng: lng
        };
        // console.log(req.user);      // info about currently logged in user
        // Create a new campground and save to DB
        Campground.create(newCampground, function(err, newlyCreated){
           if(err){
                console.log(err);
           } else {
                // redirect back to campgrounds page
                console.log(newlyCreated);
                res.redirect("/campgrounds");
           }
        });
    });
});

// REST NEW - show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single campground
router.get("/:id", function(req, res){
    // find campground with provided ID
    // passing actual comments need to use .populate then .exec
    // finding campground by ID, then populate comments and then execute query
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
            console.log(err);
        } else {
            console.log(foundCampground);
            // render show template with said campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// REST EDIT - GET
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        // error checking is redundant because otherwise middleware would return error
        Campground.findById(req.params.id, function(err, foundCampground){
            res.render("campgrounds/edit", {campground: foundCampground});
    });
});


// REST UPDATE- PUT
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// REST DESTROY - DELETE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

// GEOCODER
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

module.exports = router;