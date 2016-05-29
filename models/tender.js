var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tenderSchema = new Schema({
    sn: {
        type: Number
    },
    caller: {
        type: String,
        required: true
    },
    item: {
        type: String,
        required: true
    },
    pubDate: {
        type: Date,
        required: true
    },
    subDate: {
        type: Date,
        required: true
    },
    pubDaily: String,
    remarks: {
        type: String
    },
    category: {
        type: [String]
    },
    img: {
        type: String
    },
    link: {
        type: String
    },
    owner: {
        type: Schema.ObjectId
    }
    
}, {collection: 'listing'});

module.exports = mongoose.model('Tender', tenderSchema);