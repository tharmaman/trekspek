// Always remember to install express, body-parser & ejs

// initializing frameworks
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose");

// connecting to MongoDB
mongoose.connect("mongodb://localhost/yelp_camp");

// executing bodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));

// setting default view engine to .ejs
app.set("view engine","ejs");

// ================= SCHEMA SETUP ================= \\
// declaring schema
var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String
});

// compiling schema into model
var Campground = mongoose.model("Campground", campgroundSchema);

// create template
// Campground.create(
//     {
//         name:"Ting Hill",
//         image: "https://pixabay.com/get/e837b1072af4003ed1584d05fb1d4e97e07ee3d21cac104496f0c071a6e8b0bb_340.jpg",
//         description: "This are so many tings here"
//     },
//     function(err, campground) {
//         if (err){
//             console.log(err);
//         } else {
//             console.log("NEWLY CREATED CAMPGROUND: ");
//             console.log(campground);
//         }
//     }
// );


// ================= ROUTES BEG ================= \\
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
            res.render("index", {campgrounds:allCampgrounds});
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
    res.render("new");
});

// be aware of order, :id goes after the specific /new

// REST SHOW - show detailed info about single campground
app.get("/campgrounds/:id", function(req, res){
    // find campground with provided ID
    Campground.findById(req.params.id, function(err, found){
        if(err){
            console.log(err);
        } else {
            // render show template with said campground
            res.render("show", {campground: found});
        }
    });
});

// ================= ROUTES END ================= \\

// adding listener
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server Has Started!")
});
