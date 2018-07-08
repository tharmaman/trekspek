var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");
var middleware = require("../middleware");
var Trek = require("../models/trek");
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

// ===============
//  ROOT ROUTE
// ===============

router.get("/", function(req, res){
   res.render("landing"); 
});

// ===============
//  AUTH ROUTES
// ===============

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

// may want to refactor later to avoid callback hell
// handle sign up logic
router.post("/register", upload.single('avatar'), function(req, res){
        // declaring new object, saving out password
        var newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar,
            bio: req.body.bio
        });
        // if image is uploaded (req.file.path)
        if (req.file){
            cloudinary.uploader.upload(req.file.path, function(result){
                // adding a secure cloudinary url for the image
                newUser.avatar = result.secure_url;
                // passing through for auth
                User.register(newUser, req.body.password, function(err, user){
                    if(err){
                        console.log(err);
                        return res.render("register", {error: err.message});  // return gets out of entire callback
                    } else {
                        passport.authenticate("local")(req, res, function(){
                            req.flash("success", "Catch you on the backcountry " + user.username +"!");
                            res.redirect("/treks");
                        });
                    }
                });
            });
        // else revert to default image
        } else {
            // passing through for auth
            User.register(newUser, req.body.password, function(err, user){
                if(err){
                    console.log(err);
                    return res.render("register", {error: err.message});  // return gets out of entire callback
                } else {
                    passport.authenticate("local")(req, res, function(){
                        req.flash("success", "Adventure awaits you " + user.username +"!");
                        res.redirect("/treks");
                    });
                }
            });
        }
});

// show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

// handling login logic and does the logging in
// app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local", 
    {
        successRedirect:"/treks",
        failureRedirect:"/login",
        successFlash: "Welcome back!",
        failureFlash: true
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/treks");
});

// ====================
//  PROFILE ROUTE
// ====================

// SHOW
router.get("/profiles/:username", function(req, res) {
    User.find({username: req.params.username}, function(err, foundProfile){
        if(err) {
            req.flash("error", "Ooops! Something went wrong!");
            res.redirect("/");
        } else {
            // .find returns an array, there need to access [0]
            Trek.find().where('author.username').equals(foundProfile[0].username).exec(function(err, treks){
                if (err){
                    req.flash("error", "Ooops! Something went wrong!");
                    res.redirect("/");  
                } else {
                    res.render("profiles/show", {profile: foundProfile[0], treks: treks});
                }
            });
        }
    });
});

// REST UPDATE- PUT
router.put("/profiles/:username", middleware.checkProfileOwnership, upload.single('image'), function(req, res){
    // checking if image file was uploaded
    if (req.file) {
        // uploading image to cloudinary
        cloudinary.uploader.upload(req.file.path, function(result){
            // adding a secure cloudinary url for the image
            req.body.user.image = result.secure_url;
            
            // updating database
            User.findOneAndUpdate({username: req.params.username}, req.body.user, function(err, user){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated Your Profile!");
                    res.redirect("/profiles/" + user.username);
                }
            });
        });   
    } else {
        // updating database
        User.findOneAndUpdate({username: req.params.username}, req.body.user, function(err, user){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated Your Profile!");
                res.redirect("/profiles/" + user.username);
            }
        });
    }
});

// REST PASSWORD UPDATE - PUT
router.put("/profiles/:username/password", middleware.checkProfileOwnership, passport.authenticate("local", 
    {
        failureFlash: "Old password does not match!",
        failureRedirect: "back"
    }), function(req, res){
        if (req.body.user.newPassword === req.body.user.retypePassword) {
            User.findOne({username: req.params.username}, function(err, foundUser){
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("back"); 
                }           
                foundUser.setPassword(req.body.user.newPassword, function(){
                    foundUser.save();
                    req.flash("success","Successfully Changed Password!");
                    res.redirect("back");
                });
            });   
        }
    });

module.exports = router;