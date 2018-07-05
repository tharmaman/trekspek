var mongoose = require("mongoose");

// ================= SCHEMA SETUP ================= \\
// declaring schema
var trekSchema = new mongoose.Schema({
   name: String,
   rating: String,
   description: String,
   location: String,
   lat: Number,
   lng: Number,
   image: {
      type: String, default: "/media/default_trek.png"   
   },
   createdAt: {
      type: Date,
      default: Date.now  
   },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
         }
      ]
});

// compiling schema into model
module.exports = mongoose.model("Trek", trekSchema);