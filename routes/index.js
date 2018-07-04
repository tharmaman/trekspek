var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");

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

// handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    if(req.body.adminCode == process.env.ADMIN_SECRET) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});  // return gets out of entire callback
        } else {
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome to TrekSpek " + user.username)
                res.redirect("/treks");
            });
        }
    });
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
        successFlash: "Welcome back ",
        failureFlash: true
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/treks");
});


module.exports = router;