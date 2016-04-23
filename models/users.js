var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');

var userSchema = new Schema({
    email : {
        type : String,
        unique : true,
        required : true
        //trim : true,
        //lowercase : true
    },
    password : {
        type : String,
        required : true
    },
    authToken : {
        type : String,
        required : true
    },
    isAuthenticated : { 
        type : Boolean, 
        required : true 
    }
}, { timestamps : true }, {collection: 'users'});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);