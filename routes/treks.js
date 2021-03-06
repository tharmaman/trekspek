// Initializing frameworks
var express = require("express");
var router = express.Router();
var Trek = require("../models/trek");
var User = require("../models/user");
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

// ================= TREKS ROUTES  ================= \\

// REST INDEX - show all treks from database 
router.get("/", function(req, res){
    var display = "Our Most Popular Treks!";
    if(req.query.search){
        display = req.query.search +" Results:";
        // get search treks from DB
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        Trek.find( { $or: [ {name: regex}, {location: regex}, {'author.username': regex } ]}, function(err, searchTreks){
            if(err){
                console.log("Damn shawty we hit an error");
                console.log(err);
            } else {
                if(searchTreks.length < 1) {
                    display = "No results match that query, please try again.";
                }
                res.render("treks/index", {treks: searchTreks, display: display, page: 'treks'});
            }
        });
        
    } else {
        // get all treks from DB
        Trek.find({}, function(err, allTreks){
            if(err){
                console.log("Damn shawty we hit an error");
                console.log(err);
            } else {
                res.render("treks/index", {treks:allTreks, display: display, page: 'treks'});
            }
        });
    }
});

// REST CREATE - add new treks to database 
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

    var image = "https://res.cloudinary.com/tharmaman/image/upload/v1530828961/default_trek.jpg";
    var name = req.body.name;
    var rating = req.body.rating;
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
        
        // checking if image is uploaded
        if (req.file){
            // uploading image to cloudinary
            cloudinary.uploader.upload(req.file.path, function(result){
                if (err){
                    console.log(err);
                    req.flash("error", "Could not upload image")
                }
                // adding a secure cloudinary url for the image
                image = result.secure_url;
                
                 // create a object to add to the db
                var newTrek = {
                    name: name, 
                    image: image, 
                    description: desc, 
                    author: author,
                    rating: rating,
                    location: location,
                    lat: lat,
                    lng: lng
                };
                
                // creating new trek document to store in DB
                Trek.create(newTrek, function(err, trek) {
                    if (err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    } else {
                        console.log(trek);
                        req.flash("success", "Successfully Added Trek!");
                        res.redirect('/treks/');
                    }
                });
            });
        } else {
            // for else just use what was from the db
            // create a object to add to the db
            var newTrek = {
                name: name, 
                image: image, 
                description: desc, 
                author: author,
                rating: rating,
                location: location,
                lat: lat,
                lng: lng
            };
            
            // creating new trek document to store in DB
            Trek.create(newTrek, function(err, trek) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                } else {
                    console.log(trek);
                    req.flash("success", "Successfully Added Trek!");
                    res.redirect('/treks/');
                }
            });
        }   
    });
});

// REST NEW - show form to create new treks
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("treks/new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single trek
router.get("/:id", function(req, res){
    // find trek with provided ID
    // passing actual comments need to use .populate then .exec
    // finding trek by ID, then populate comments and then execute query
    Trek.findById(req.params.id).populate("comments").exec(function(err, foundTrek){
        if(err || !foundTrek){
            req.flash("error", "Trek not found");
            res.redirect("back");
            console.log(err);
        } else {
            console.log(foundTrek);
            // render show template with said trek
            // need to send information about the author to grab avatar
            User.findById(foundTrek.author.id).exec(function(err, foundUser){
                if (err || !foundUser){
                    req.flash("error", "Author does not exist");
                    console.log(err);
                } else {
                    res.render("treks/show", {trek: foundTrek, user: foundUser});
                }
            });
        }
    });
});

// REST EDIT - GET
router.get("/:id/edit", middleware.checkTrekOwnership, function(req, res){
        // error checking is redundant because otherwise middleware would return error
        Trek.findById(req.params.id, function(err, foundTrek){
            res.render("treks/edit", {trek: foundTrek});
    });
});


// REST UPDATE- PUT
router.put("/:id", middleware.checkTrekOwnership, upload.single('image'), function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        // adding to trek object these below properties
        req.body.trek.lat = data[0].latitude;
        req.body.trek.lng = data[0].longitude;
        req.body.trek.location = data[0].formattedAddress;
        
        // checking if image file was uploaded
        if (req.file) {
            // uploading image to cloudinary
            cloudinary.uploader.upload(req.file.path, function(result){
                if (err){
                    console.log(err);
                    req.flash("error", "Could not upload image");
                }
                // adding a secure cloudinary url for the image
                req.body.trek.image = result.secure_url;
                
                // updating database
                Trek.findByIdAndUpdate(req.params.id, req.body.trek, function(err, trek){
                    if(err){
                        req.flash("error", err.message);
                        res.redirect("back");
                    } else {
                        req.flash("success","Successfully Updated Trek!");
                        res.redirect("/treks/" + trek._id);
                    }
                });
            });   
        } else {
            // updating database
            Trek.findByIdAndUpdate(req.params.id, req.body.trek, function(err, trek){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated Trek!");
                    res.redirect("/treks/" + trek._id);
                }
            });
        }
    });
});

// REST DESTROY - DELETE
router.delete("/:id", middleware.checkTrekOwnership, function(req, res){
    Trek.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/treks");
        } else {
            req.flash("success", "Successfully Deleted Trek!");
            res.redirect("/treks");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;