// Always remember to install express, body-parser & ejs

// initializing frameworks
var express             = require("express"),
    app                 = express(),
    bodyParser          = require("body-parser"),
    mongoose            = require("mongoose"),
    Campground          = require("./models/campground"),
    Comment             = require("./models/comment"),
    seedDB              = require("./seeds");

seedDB();

// connecting to MongoDB
mongoose.connect("mongodb://localhost/yelp_camp");

// executing bodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));

// setting default view engine to .ejs
app.set("view engine","ejs");


// ================= CAMPGROUNDS ROUTES BEG ================= \\
app.get("/", function(req, res){
   res.render("landing"); 
});

// CAMPGROUNDS

// REST INDEX - show all campgrounds from database 
app.get("/campgrounds", function(req, res){
    // get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log("Damn shawty we hit an error");
            console.log(err);
        } else {
            console.log("HERE ARE ALL THE CAMPGROUNDS!!");
            console.log(allCampgrounds);
            // render campgrounds
            res.render("campgrounds/index", {campgrounds:allCampgrounds});
        }
    });
});

// REST CREATE - add new campgrounds to database 
app.post("/campgrounds", function(req, res){
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
app.get("/campgrounds/new", function(req, res){
    res.render("campgrounds/new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single campground
app.get("/campgrounds/:id", function(req, res){
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

// =================== COMMENTS ROUTES =================== \\

// NEW
app.get("/campgrounds/:id/comments/new", function(req,res){
    // find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {campground:campground});
        }
    });
});


// CREATE
app.post("/campgrounds/:id/comments", function(req, res){
    // lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
       if (err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                   console.log(err);
               } else {
                   campground.comments.push(comment);
                   campground.save();
                   res.redirect("/campgrounds/" + campground._id);
               }
           })
       }
    });
});





// =============== LISTENER INITIALIZATION =============== \\


// adding listener
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server Has Started!")
});
