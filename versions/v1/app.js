// Always remember to install express, body-parser & ejs

// initializing express framework
var express = require("express");
var app = express();

// initializing body-parser framework
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));

// setting default view engine to .ejs
app.set("view engine","ejs");

// TEMP ARRAY
var campgrounds = [
    {
        name: "Salmon Creek",
        image: "https://pixabay.com/get/e837b1072af4003ed1584d05fb1d4e97e07ee3d21cac104496f0c071a6e8b0bb_340.jpg"
    },
    {
        name: "Bear Mountain",
        image: "https://pixabay.com/get/e83db50a21f4073ed1584d05fb1d4e97e07ee3d21cac104496f0c071a6e8b0bb_340.jpg" 
    },
    {
        name: "Ting Woods",
        image: "https://pixabay.com/get/ef3cb00b2af01c22d2524518b7444795ea76e5d004b0144295f1c978a2e8b6_340.jpg" 
    },
    {
        name: "Baddie Valley",
        image: "https://pixabay.com/get/e837b1072af4003ed1584d05fb1d4e97e07ee3d21cac104496f0c071a6e8b0bb_340.jpg"
    },
    {
        name: "Wasteman Lakes",
        image: "https://pixabay.com/get/e83cb80c2ef0043ed1584d05fb1d4e97e07ee3d21cac104496f0c379afebb1bf_340.jpg" 
    },
    {
        name: "Clifford Cliffs",
        image: "https://pixabay.com/get/ec31b10e29fd1c22d2524518b7444795ea76e5d004b0144295f2c171a1eab1_340.jpg" 
    }
]

// ================= ROUTES BEG ================= \\
app.get("/", function(req, res){
   res.render("landing"); 
});

app.get("/campgrounds", function(req, res){
    res.render("campgrounds", {campgrounds:campgrounds});
});

app.post("/campgrounds", function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var newCampground = {name: name, image: image}
    campgrounds.push(newCampground);
    // redirect back to campgrounds page
    res.redirect("/campgrounds");
});


app.get("/campgrounds/new", function(req, res){
    res.render("new.ejs");
});

// ================= ROUTES END ================= \\

// adding listener
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server Has Started!")
});
