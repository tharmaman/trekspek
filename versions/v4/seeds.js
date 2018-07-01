// initializing frameworks
var mongoose        = require("mongoose");
var Campground      = require("./models/campground");
var Comment         = require("./models/comment");

// populating with data
var data = [
    {
        name: "Cloud's Rest", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "Schlitz hexagon adaptogen cliche franzen kitsch you probably haven't heard of them freegan cloud bread man braid kombucha. Adaptogen migas lo-fi, subway tile food truck roof party prism wolf biodiesel sustainable irony fashion axe sriracha."
    },
    {
        name: "Desert Mesa", 
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
        description: "Narwhal put a bird on it 90's godard, drinking vinegar roof party banh mi artisan succulents glossier beard chambray ennui. Pok pok fanny pack cornhole chambray meh single-origin coffee forage viral intelligentsia leggings post-ironic. Sartorial intelligentsia heirloom umami kogi."
    },
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "Viral organic bicycle rights actually art party readymade tofu pug hot chicken occupy hashtag glossier master cleanse banjo marfa. Waistcoat tote bag lomo letterpress heirloom sustainable viral neutra. Gentrify hoodie normcore pinterest, yr woke fashion axe adaptogen pork belly 8-bit occupy letterpress"
    }
]
 
function seedDB(){
   //Remove all campgrounds
   Campground.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed campgrounds!");
        Comment.remove({}, function(err) {
            if(err){
                console.log(err);
            }
            console.log("removed comments!");
             //add a few campgrounds
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("added a campground");
                        //create a comment
                        Comment.create(
                            {
                                text: "This place is great, but I wish there was internet",
                                author: "Homer"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    campground.comments.push(comment);
                                    campground.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 
    //add a few comments
}
 
module.exports = seedDB;