var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');
//var Tender = require('tender');

var Group = new Schema({
    name : {
        type : String,
        required : true
    },
    admin : {
        type : Schema.ObjectId,
        ref : 'User',
        required : true 
    },
    members : [{
        type : Schema.ObjectId,
        ref : 'User'
    }],
    requests : [{
        type : Schema.ObjectId,
        ref : 'User'
    }]
});

var Competitor = new Schema({
    name : {
        type : String,
        required : true
    },
    address : String,
    contactPerson : String,
    phone : String
});

var UserTender = new Schema({
    _id : {
        type : Schema.ObjectId,
        ref : 'Tender',
        required : true    
    },
    item : String,
    preferences : {
        notify : {
            type : Boolean,
            default : false
        },
        notifyFrequency : {
            oneday : {
                type : Boolean,
                default : true
            },
            threedays : {
                type : Boolean,
                default : false
            },
            fivedays : {
                type : Boolean,
                default : false
            },
            sevendays : {
                type : Boolean,
                default : false
            }
        }
    },
    userTags : [String],
    notes : {
        type : String,
        default : 'Type your notes here !'
    }, 
    participationInfo : {
        quotation : {
            type: Number
            //,required : true
        },
        currency : {
            type : String,
            default : 'NRs'
        },
        vat : {
            type : Boolean,
            default : true
        },
        winner : {
            type : Boolean,
            default : false
        },
        security : Number,
        validity : Date,
        issuer : String,
        manufacturer : String,
        remarks : String,
        competitorsBid : [
            {
                _id : {
                    type : Schema.ObjectId,
                    ref : 'Competitor'
                    //, required : true    
                },
                name : String,
                quotation : {
                    type: Number
                    //,required : true
                },
                currency : {
                    type : String,
                    default : 'NRs'
                },
                vat : {
                    type : Boolean,
                    default : true
                },
                winner : {
                    type : Boolean,
                    default : false
                },
                security : Number,
                validity : Date,
                issuer : String,
                manufacturer : String,
                remarks : String
            }
        ]
    }
});

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
    admin : {
        type : Boolean,
        default : false
    },
    authToken : String,
    isAuthenticated : { 
        type : Boolean, 
        required : true 
    },
    resetToken : String, //password reset
    resetExpires : Date,
    messages : [String],
    tenders : [UserTender],
    myListings : [Schema.ObjectId],
    competitors : [Competitor],
    groups : [Group],
    name : String,
    company : String,
    position : String,
    address : String,
    phone : String,
    ip : String,
    location : {
        city : String,
        country : String,
        countryCode : String,
        region : String,
        regionName : String,
        isp : String,
        lat : Number,
        lon : Number,
        status : String,
        timezone : String,
        zip : String
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

// currently using generateHash() method to hash password
// alternately this method auto hashes password on each save
// userSchema.pre('save', function(next){
//     var user = this;

//     if (!user.isModified('password')) {
//         return next();
//     }

//     user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(8), null);
//     next();
// });


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);