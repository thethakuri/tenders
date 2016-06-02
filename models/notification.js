var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notifySchema = new Schema({
    date : {
        type : Date,
        required : true
    },
    email : {
        type : String,
        required: true
    },
    tender : {
        _id : {
            type : Schema.ObjectId,
            ref : 'Tender',
            required : true
        },
        item : String,
        subDate : Date
    }
    
}, {collection : 'notification'});

module.exports = mongoose.model('Notify', notifySchema);