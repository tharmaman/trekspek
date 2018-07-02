// initializing variables
var Campground = require("../models/campground");
var Comment = require("../models/comment");

// all the middleware goes here
var middlewareObj = {};     //  contains all of the methods

middlewareObj.checkCampgroundOwnership = function (req, res, next){
    if (req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                // does user own campground?
                // console.log(foundCampground.author.id);
                // console.log(req.user._id);
                // needs to use .equals() because one is string other is object
                if(foundCampground.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};


middlewareObj.checkCommentOwnership = function (req, res, next){
    if (req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                // does user own comment?
                // needs to use .equals() because one is string other is object
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that")
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};


middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    // basically an else statement but a return is made for the best case
    req.flash("error", "You need to be logged in to do that");    // do BEFORE redirect    
    res.redirect("/login");
};


module.exports = middlewareObj;