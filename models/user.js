var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {
        type: String, unique: true, required: true
    },
    password: String,
    avatar: {
        type: String, default: "/media/default_profile.png"   
    },
    firstName: String,
    lastName: String,
    email: {
        type: String, unique: true, required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    bio: String,
    isAdmin: {
        type: Boolean, default: false
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);