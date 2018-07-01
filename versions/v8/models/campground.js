var mongoose = require("mongoose");

// ================= SCHEMA SETUP ================= \\
// declaring schema
var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   comments: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
         }
      ]
});

// compiling schema into model
module.exports = mongoose.model("Campground", campgroundSchema);