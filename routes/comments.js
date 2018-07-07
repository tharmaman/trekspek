var express = require("express");
var router = express.Router({mergeParams: true});       // merge params from trek and comments
var Trek = require("../models/trek");
var Comment = require("../models/comment")
var middleware = require("../middleware")

// =================== COMMENTS ROUTES =================== \\

// NEW
router.get("/new", middleware.isLoggedIn, function(req,res){
    // find trek by id
    Trek.findById(req.params.id, function(err, trek){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {trek:trek});
        }
    });
});


// CREATE
router.post("/", function(req, res){
    // lookup trek using ID
    console.log(req.params.id)
    Trek.findById(req.params.id, function(err, trek){
       if (err){
           console.log(err);
           res.redirect("/treks");
       } else {
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                   req.flash("error", "Something went wrong");
                   console.log(err);
               } else {
                   //   add username and id to comment
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.author.avatar = req.user.avatar;
                   comment.author.isAdmin = req.user.isAdmin;
                   //   save comment
                   comment.save();
                   trek.comments.push(comment);
                   trek.save();
                   console.log(comment);
                   req.flash("success", "Successfully added comment");
                   res.redirect("/treks/" + trek._id);
               }
           })
       }
    });
});

// EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Trek.findById(req.params.id, function(err, foundTrek) {
        if (err || !foundTrek){
            req.flash("error", "No Trek found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if (err) {
                res.redirect("back");
            } else {
                res.render("comments/edit", {trek_id: req.params.id, comment: foundComment});
            }
        });
    })
});

// UPDATE
// /trek/:id/comments/:comment_id

router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else {
            res.redirect("/treks/" + req.params.id);
        }
    })
});

// DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    // findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/treks/" + req.params.id);
        }
    });
});

module.exports = router;