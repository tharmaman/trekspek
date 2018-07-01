var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");

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
            console.log("HERE ARE ALL THE CAMPGROUNDS!!");
            console.log(allCampgrounds);
            // render campgrounds
            res.render("campgrounds/index", {campgrounds:allCampgrounds, currentUser: req.user});
        }
    });
});

// REST CREATE - add new campgrounds to database 
router.post("/", isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCampground = {name: name, image: image, description: desc};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newCamp){
       if(err){
            console.log(err);
       } else {
            // redirect back to campgrounds page
            res.redirect("/campgrounds");
       }
    });
});

// REST NEW - show form to create new campgrounds
router.get("/new", function(req, res){
    res.render("campgrounds/new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single campground
router.get("/:id", function(req, res){
    // find campground with provided ID
    // passing actual comments need to use .populate then .exec
    // finding campground by ID, then populate comments and then execute query
    Campground.findById(req.params.id).populate("comments").exec(function(err, found){
        if(err){
            console.log(err);
        } else {
            console.log(found);
            // render show template with said campground
            res.render("campgrounds/show", {campground: found});
        }
    });
});

// MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;