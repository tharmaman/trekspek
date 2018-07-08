var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");
var middleware = require("../middleware");
var Trek = require("../models/trek");
var multer = require('multer');
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
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
//  PASSWORD RECOVERY
// ====================

// forgot password SHOW
router.get("/forgot", function(req, res){
    res.render("forgot");
});

// forgot password POST
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'trekspekteam@gmail.com',
          pass: process.env.MAIL_PASS
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'trekspekteam@gmail.com',
        subject: 'Reset Your Password',
        text: "Hi " + user.username + ',\n\n' +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://" + req.headers.host + "/reset/" + token + "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


// token show
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

// token post
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'trekspekteam@gmail.com',
          pass: process.env.MAIL_PASS
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'trekspekteam@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/treks');
  });
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