// initializing variables
var Trek = require("../models/trek");
var Comment = require("../models/comment");
var User = require("../models/user");

// all the middleware goes here
var middlewareObj = {};     //  contains all of the methods

middlewareObj.checkTrekOwnership = function (req, res, next){
    if (req.isAuthenticated()){
        Trek.findById(req.params.id, function(err, foundTrek){
            if(err || !foundTrek){
                req.flash("error", "Trek not found");
                res.redirect("back");
            } else {
                // does user own trek?
                // console.log(foundTrek.author.id);
                // console.log(req.user._id);
                // needs to use .equals() because one is string other is object
                if(foundTrek.author.id.equals(req.user._id) || req.user.isAdmin){
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
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

middlewareObj.checkProfileOwnership = function (req, res, next){
    if (req.isAuthenticated()){
        User.findOne({username: req.params.username}, function(err, foundUser){
            if(err || !foundUser){
                req.flash("error", "User not found");
                res.redirect("back");
            } else {
                // does user own comment?
                if(foundUser.username === req.user.username || req.user.isAdmin){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
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